#!/bin/bash

# Fix imports in server files by adding .js extensions

# database.ts
sed -i "s|from '../utils/logger'|from '../utils/logger.js'|g" server/config/database.ts

# encryption.ts
sed -i "s|from '../utils/logger'|from '../utils/logger.js'|g" server/config/encryption.ts

# poemController.ts
sed -i "s|from '../models/Poem'|from '../models/Poem.js'|g" server/controllers/poemController.ts
sed -i "s|from '../utils/logger'|from '../utils/logger.js'|g" server/controllers/poemController.ts

# syncController.ts
sed -i "s|from '../models/Poem'|from '../models/Poem.js'|g" server/controllers/syncController.ts

# userController.ts
sed -i "s|from '../models/User'|from '../models/User.js'|g" server/controllers/userController.ts
sed -i "s|from '../services/emailService'|from '../services/emailService.js'|g" server/controllers/userController.ts

# auth.ts
sed -i "s|from '../models/User'|from '../models/User.js'|g" server/middleware/auth.ts
sed -i "s|from '../utils/logger'|from '../utils/logger.js'|g" server/middleware/auth.ts

# poems.ts
sed -i "s|from '../middleware/auth'|from '../middleware/auth.js'|g" server/routes/poems.ts
sed -i "s|from '../middleware/encryption'|from '../middleware/encryption.js'|g" server/routes/poems.ts
sed -i "s|from '../controllers/poemController'|from '../controllers/poemController.js'|g" server/routes/poems.ts

# sync.ts
sed -i "s|from '../middleware/auth'|from '../middleware/auth.js'|g" server/routes/sync.ts
sed -i "s|from '../middleware/encryption'|from '../middleware/encryption.js'|g" server/routes/sync.ts
sed -i "s|from '../controllers/syncController'|from '../controllers/syncController.js'|g" server/routes/sync.ts

# users.ts
sed -i "s|from '../middleware/auth'|from '../middleware/auth.js'|g" server/routes/users.ts
sed -i "s|from '../controllers/userController'|from '../controllers/userController.js'|g" server/routes/users.ts

echo "Import-Pfade wurden aktualisiert!"
