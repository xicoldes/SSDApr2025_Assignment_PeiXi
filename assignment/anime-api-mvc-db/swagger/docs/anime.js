/**
 * @swagger
 * /anime:
 *   get:
 *     summary: Get all anime with advanced filtering, sorting, and pagination
 *     tags: [Anime]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter by genre (partial match)
 *       - in: query
 *         name: studio
 *         schema:
 *           type: string
 *         description: Filter by animation studio (partial match)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [title, episodes, rating, release_date, created_at]
 *           default: title
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: ASC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Anime list retrieved successfully
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
 *                         $ref: '#/components/schemas/Anime'
 *                     filters:
 *                       type: object
 *                       description: Applied filters and sorting
 *   post:
 *     summary: Create new anime (Admin only)
 *     tags: [Anime]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               genre:
 *                 type: string
 *               episodes:
 *                 type: integer
 *               studio:
 *                 type: string
 *           example:
 *             title: "Attack on Titan"
 *             description: "Humanity fights against giant humanoid Titans"
 *             genre: "Action, Drama"
 *             episodes: 75
 *             studio: "MAPPA"
 *     responses:
 *       201:
 *         description: Anime created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 anime_id:
 *                   type: integer
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /anime/{id}:
 *   get:
 *     summary: Get anime by ID
 *     tags: [Anime]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Anime ID
 *     responses:
 *       200:
 *         description: Anime retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Anime'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update anime (Admin only)
 *     tags: [Anime]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               genre:
 *                 type: string
 *               episodes:
 *                 type: integer
 *               studio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Anime updated successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Delete anime and all related data (Admin only)
 *     tags: [Anime]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Anime ID
 *     responses:
 *       204:
 *         description: Anime deleted successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */