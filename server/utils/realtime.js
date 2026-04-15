let ioInstance = null;

function setIoInstance(io) {
  ioInstance = io;
}

function getIoInstance() {
  return ioInstance;
}

function emitToUser(userId, event, payload) {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
}

module.exports = {
  setIoInstance,
  getIoInstance,
  emitToUser
};
