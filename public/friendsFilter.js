let socket = io.connect();

function add(btn) {
    if (btn.innerHTML === 'Requested') {
        btn.innerHTML = 'Add Friend'
        socket.emit('cancelRequest', btn.id)
    } else {
        socket.emit('addFriend', btn.id)
        btn.innerHTML = 'Requested'
    }

}

socket.on('list', list => {
    console.log(list)
    for (let i = 0; i < list.length; i++) {
        const elem = document.getElementById(list[i].friend)
        if (list[i].success === true) {
            elem.innerHTML = 'Added'
        } else {
            elem.innerHTML = 'Requested'
        }
    }
})
