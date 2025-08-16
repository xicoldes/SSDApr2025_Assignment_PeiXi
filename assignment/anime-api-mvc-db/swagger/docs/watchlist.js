/**
 * @swagger
 * /watchlist:
 *   post:
 *     summary: Add anime to user's watchlist
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [anime_id, status]
 *             properties:
 *               anime_id:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [watching, completed, on-hold, dropped, plan-to-watch]
 *           example:
 *             anime_id: 2
 *             status: "plan-to-watch"
 *     responses:
 *       201:
 *         description: Anime added to watchlist successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Added to watchlist"
 *       400:
 *         description: Anime already in watchlist
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /watchlist/{user_id}:
 *   get:
 *     summary: Get user's watchlist with filtering and pagination
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [watching, completed, on-hold, dropped, plan-to-watch]
 *         description: Filter by watch status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [updated_at, title, rating]
 *           default: updated_at
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Watchlist retrieved successfully
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
 *                         allOf:
 *                           - $ref: '#/components/schemas/Anime'
 *                           - $ref: '#/components/schemas/WatchlistEntry'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /watchlist/{anime_id}:
 *   put:
 *     summary: Update watchlist entry
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: anime_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Anime ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [watching, completed, on-hold, dropped, plan-to-watch]
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               progress:
 *                 type: integer
 *                 minimum: 0
 *               notes:
 *                 type: string
 *           example:
 *             status: "completed"
 *             rating: 4
 *             progress: 366
 *             notes: "Great anime, loved the Soul Society arc!"
 *     responses:
 *       200:
 *         description: Watchlist entry updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Watchlist entry updated successfully"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Remove anime from watchlist
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: anime_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Anime ID
 *     responses:
 *       204:
 *         description: Anime removed from watchlist successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */