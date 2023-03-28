const socket = io.connect()

const url = new URL(window.location.href)
const urlToSplit = url + ''
socket.emit('join')

let name
let user


const new_url = urlToSplit.split('/')
const param = new_url[4].split('_')
name = param[0]
user = param[1]

let friend = document.getElementsByClassName('user_name')

console.log(friend)

function add() {
    socket.emit('addFriend', friend)
}



let textarea = document.querySelector('#textarea')
let messageArea = document.querySelector('.message__area')


textarea.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        sendMessage(e.target.value)
        textarea.value = ''
    }
})

let msg

const sendMessage = async (message) => {
    msg = {
        user: name,
        message: message.trim()
    }

    socket.emit('message', msg)

    appendMessage(msg, 'outgoing')
    scrollToBottom()
}


const appendMessage = (msg, type) => {
    let mainDiv = document.createElement('div')
    let className = type
    mainDiv.classList.add(className, 'message')

    let markup = `
        <p>${msg.message}</p>
    `

    mainDiv.innerHTML = markup

    messageArea.appendChild(mainDiv)
}

//Receive message

socket.on('msg', (msg) => {
    appendMessage(msg, 'incoming')
    scrollToBottom()
    console.log(msg)
})
const scrollToBottom = () => {
    messageArea.scrollTop = messageArea.scrollHeight
}

// window.setTimeout(function () {
//     messageArea.scrollTop = messageArea.scrollHeight
// }, 125)

socket.on('chatHistory', (data) => {
    const messages = document.getElementsByClassName('message')
    messages.remove
    const chat = data[0].chats

    chat.forEach((item) => {
        console.log(item)
    })

    for (let i = 0; i < chat.length; i++) {
        let chatD = chat[i].msg
        let msg = {
            user: chat[i].username,
            message: chatD
        }
        if (chat[i].username === name) {
            appendMessage(msg, 'outgoing')
        } else {
            appendMessage(msg, 'incoming')
        }
        console.log(chatD)
    }
})
