/**
 * @swagger
 * /threads:
 *   post:
 *     summary: Create a new discussion thread
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               anime_id:
 *                 type: integer
 *                 description: Related anime ID (optional for general discussions)
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *           example:
 *             anime_id: 1
 *             title: "Best JoJo Part Discussion"
 *             content: "Which JoJo part is your favorite and why?"
 *     responses:
 *       201:
 *         description: Thread created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 thread_id:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /threads/{anime_id}:
 *   get:
 *     summary: Get all threads for a specific anime
 *     tags: [Forum]
 *     parameters:
 *       - in: path
 *         name: anime_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Anime ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [created_at, title, view_count]
 *           default: created_at
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Threads retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Thread'
 */

/**
 * @swagger
 * /threads/{id}:
 *   put:
 *     summary: Update thread (Owner or Admin only)
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Thread ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thread updated successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
*   delete:
 *     summary: Delete thread (Admin only)
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Thread ID
 *     responses:
 *       204:
 *         description: Thread deleted successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Add a comment to a thread
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [thread_id, content]
 *             properties:
 *               thread_id:
 *                 type: integer
 *               content:
 *                 type: string
 *               parent_comment_id:
 *                 type: integer
 *                 nullable: true
 *                 description: ID of parent comment for nested replies
 *           example:
 *             thread_id: 1
 *             content: "I think Star Platinum is the strongest stand!"
 *             parent_comment_id: null
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comment_id:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /comments/{thread_id}:
 *   get:
 *     summary: Get all comments for a thread
 *     tags: [Forum]
 *     parameters:
 *       - in: path
 *         name: thread_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Thread ID
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 */

/**
 * @swagger
 * /comments/{id}/upvote:
 *   put:
 *     summary: Upvote a comment
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment upvoted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment upvoted"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Delete a comment (Owner or Admin only)
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     responses:
 *       204:
 *         description: Comment deleted successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 * /comments/{id}/downvote:
 *   put:
 *     summary: Downvote a comment
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment downvoted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment downvoted"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */