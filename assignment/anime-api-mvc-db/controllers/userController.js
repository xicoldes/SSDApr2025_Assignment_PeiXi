const { poolPromise, sql } = require('../dbConfig');
const bcrypt = require('bcryptjs');

module.exports = {
  // Get all users (Admin only)
  getAllUsers: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        role,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        search
      } = req.query;

      const offset = (page - 1) * limit;
      const pool = await poolPromise;
      
      // Build dynamic query
      let query = `
        SELECT 
          user_id, username, email, role, profile_pic, bio, created_at
        FROM users
        WHERE 1=1
      `;
      
      const request = pool.request();
      
      // Add filters
      if (role) {
        query += ` AND role = @role`;
        request.input('role', sql.VarChar, role);
      }
      
      if (search) {
        query += ` AND (username LIKE @search OR email LIKE @search)`;
        request.input('search', sql.VarChar, `%${search}%`);
      }
      
      // Add sorting (removed updated_at since it doesn't exist)
      const validSortColumns = ['username', 'email', 'role', 'created_at'];
      const validSortOrders = ['ASC', 'DESC'];
      
      const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
      const sortDirection = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
      
      query += ` ORDER BY ${sortColumn} ${sortDirection}`;
      
      // Add pagination
      query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
      request.input('offset', sql.Int, parseInt(offset));
      request.input('limit', sql.Int, parseInt(limit));
      
      const result = await request.query(query);
      
      // Get total count for pagination metadata
      let countQuery = `SELECT COUNT(*) as total FROM users WHERE 1=1`;
      const countRequest = pool.request();
      
      if (role) {
        countQuery += ` AND role = @role`;
        countRequest.input('role', sql.VarChar, role);
      }
      
      if (search) {
        countQuery += ` AND (username LIKE @search OR email LIKE @search)`;
        countRequest.input('search', sql.VarChar, `%${search}%`);
      }
      
      const countResult = await countRequest.query(countQuery);
      const total = countResult.recordset[0].total;
      
      res.json({
        data: result.recordset,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        filters: {
          role,
          search,
          sortBy: sortColumn,
          sortOrder: sortDirection
        }
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  },

  // Get user profile by ID
  getUserProfile: async (req, res) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('user_id', sql.Int, req.params.id)
        .query('SELECT user_id, username, email, role, profile_pic, bio FROM users WHERE user_id = @user_id');
      
      if (!result.recordset[0]) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(result.recordset[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  },

  // FIXED: Update user profile
  updateProfile: async (req, res) => {
    try {
      const { username, email, password, bio } = req.body;
      const userId = req.params.id;
      const pool = await poolPromise;
      
      // Check if user exists first
      const userCheck = await pool.request()
        .input('user_id', sql.Int, userId)
        .query('SELECT user_id FROM users WHERE user_id = @user_id');
      
      if (userCheck.recordset.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Build update query dynamically
      const updateFields = [];
      const request = pool.request();
      
      // Add user_id parameter
      request.input('user_id', sql.Int, userId);
      
      // Add fields to update based on what's provided
      if (username !== undefined && username !== '') {
        updateFields.push('username = @username');
        request.input('username', sql.VarChar, username);
      }
      
      if (email !== undefined && email !== '') {
        updateFields.push('email = @email');
        request.input('email', sql.VarChar, email);
      }
      
      if (password !== undefined && password !== '') {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateFields.push('password_hash = @password_hash');
        request.input('password_hash', sql.VarChar, hashedPassword);
      }
      
      if (bio !== undefined) {
        updateFields.push('bio = @bio');
        request.input('bio', sql.Text, bio || null);
      }
      
      // If no fields to update, return error
      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No valid fields provided for update' });
      }
      
      // Build the final query
      const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = @user_id`;
      
      console.log('Update query:', updateQuery);
      console.log('Update fields:', updateFields);
      
      // Execute the update
      const result = await request.query(updateQuery);
      
      console.log('Update result:', result);
      
      res.json({ 
        message: `Profile updated successfully`,
        updatedFields: updateFields.length
      });
      
    } catch (error) {
      console.error('Update profile error:', error);
      
      // Handle specific SQL Server errors
      if (error.number === 2627) {
        return res.status(409).json({ error: 'Username or email already exists' });
      }
      
      res.status(500).json({ 
        error: 'Failed to update profile',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // NEW: Delete user (admin only)
  deleteUser: async (req, res) => {
    try {
      const userId = req.params.id;
      const pool = await poolPromise;

      console.log(`Starting deletion process for user ID: ${userId}`);

      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        // 1. Delete comments by this user
        console.log('Deleting user comments...');
        const deleteComments = new sql.Request(transaction);
        await deleteComments
          .input('user_id', sql.Int, userId)
          .query('DELETE FROM forum_comments WHERE user_id = @user_id');

        // 2. Delete threads by this user
        console.log('Deleting user threads...');
        const deleteThreads = new sql.Request(transaction);
        await deleteThreads
          .input('user_id', sql.Int, userId)
          .query('DELETE FROM forum_threads WHERE user_id = @user_id');

        // 3. Delete watchlist entries
        console.log('Deleting watchlist entries...');
        const deleteWatchlist = new sql.Request(transaction);
        await deleteWatchlist
          .input('user_id', sql.Int, userId)
          .query('DELETE FROM user_anime_list WHERE user_id = @user_id');

        // 4. Delete the user
        console.log('Deleting user...');
        const deleteUser = new sql.Request(transaction);
        const userResult = await deleteUser
          .input('user_id', sql.Int, userId)
          .query('DELETE FROM users WHERE user_id = @user_id');

        if (userResult.rowsAffected[0] === 0) {
          await transaction.rollback();
          return res.status(404).json({ error: 'User not found' });
        }

        await transaction.commit();
        console.log('User deletion transaction committed successfully');
        
        res.status(204).end();
        
      } catch (innerError) {
        console.error('Inner transaction error:', innerError);
        await transaction.rollback();
        throw innerError;
      }
    } catch (error) {
      console.error('Full error details:', error);
      res.status(500).json({ 
        error: 'Failed to delete user',
        details: error.message
      });
    }
  }
};