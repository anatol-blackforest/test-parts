const socket = io.connect('http://localhost:3000');

window.onload = function () {
    socket.emit('loaded')
}