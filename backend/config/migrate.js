function ensureUserTitleColumn(db) {
  const userColumns = db.prepare('PRAGMA table_info(users)').all().map(column => column.name);
  if (!userColumns.includes('title')) {
    db.exec("ALTER TABLE users ADD COLUMN title TEXT DEFAULT ''");
  }
}

module.exports = {
  ensureUserTitleColumn,
};
