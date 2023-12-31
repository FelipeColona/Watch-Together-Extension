const container = document.getElementById("container")
const createRoomBtn = document.getElementById("createRoomBtn")
const enterRoomBtn = document.getElementById("enterRoomBtn")
const startBtn = document.getElementById("startBtn")
const nameInput = document.getElementById("nameInput")

//Listen to messages from the background script
//in order to update the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action == "roomId") {
    updateState()
  }
  if (request.action == "socketsInRoom") {
    let i = 0
    request.payload.forEach((socket) => {
      const nameSpan = document.createElement("span")
      nameSpan.className = "socketsInRoom"

      const br = document.createElement("br")
      container.append(br)

      if (socket.currentUrl !== undefined) {
        nameSpan.innerHTML = `${socket.name} is watching: <a href="${socket.currentUrl}" class="links" id="link${i}">link</a>`
        container.append(nameSpan)

        document.getElementById(`link${i}`).addEventListener("click", (event) => {
          let targetElement = event.target || event.srcElement;
          chrome.tabs.create({ url: targetElement.href });
          return false;
        })
      } else {
        nameSpan.textContent = `${socket.name}`
        container.append(nameSpan)
      }
      i++
    })
  }

  if (request.action == "roomNotFound") {
    updateState("Room not found!")
  }
  if (request.action == "disconnected") {
    updateState()
  }
})

//Updates the popup according to the state of the browser
function updateState(error = "") {
  chrome.runtime.sendMessage({ action: "checkState" }, response => {
    console.log(response)
    //If there is an error message, display it
    if (error !== "") {
      const otherAlerts = document.getElementsByClassName("alert alert-danger")
      //Checks if there is already an alert and remove it
      if (otherAlerts.length != 0) {
        otherAlerts.item(0).remove()
      }
      const errorSpan = document.createElement("span")
      errorSpan.textContent = error
      errorSpan.className = "alert alert-danger"
      errorSpan.setAttribute("role", "alert")
      container.prepend(errorSpan)

      setTimeout(() => {
        errorSpan.remove()
      }, 2000)
    }
    //If the connection is open and the socket is not connected to a room
    if (response.isConnectionOpen && response.roomId == "") {
      nameInput.style.display = "none"
      startBtn.style.display = "none"
      createRoomBtn.style.display = "inline"
      enterRoomBtn.style.display = "inline"

      createRoomBtn.addEventListener("click", createRoom)
      enterRoomBtn.addEventListener("click", renderEnterRoom)
    }
    //If the connection is open and the socket is connected to a room
    else if (response.isConnectionOpen && response.roomId !== "") {
      //Make every element inside the container display none
      Array.from(container.children).forEach(child => {
        child.style.display = "none"
      })

      const roomIdSpan = document.createElement("span")
      roomIdSpan.id = "roomIdSpan"
      roomIdSpan.textContent = `${response.roomId}`
      container.appendChild(roomIdSpan)

      const br = document.createElement("br")
      container.appendChild(br)

      chrome.runtime.sendMessage({ action: "getSocketsInRoom" })

      const disconnectBtn = document.createElement("button")
      disconnectBtn.id = "disconnectBtn"
      disconnectBtn.className = "btn btn-danger"
      disconnectBtn.textContent = "Disconnect"
      disconnectBtn.addEventListener("click", () => chrome.runtime.sendMessage({ action: "disconnect" }))
      container.appendChild(disconnectBtn)
    }
    //Default state
    //Neither the connection is open nor the socket is in a room
    else {
      //Make every element inside the container display none
      Array.from(container.children).forEach(child => {
        child.style.display = "none"
      })

      nameInput.style.display = "block"
      startBtn.style.display = "block"

      startBtn.addEventListener("click", () => {
        if (nameInput.value == "") {
          return false
        }
        chrome.runtime.sendMessage({ action: "connect", payload: nameInput.value })

        nameInput.style.display = "none"
        startBtn.style.display = "none"
        createRoomBtn.style.display = "inline"
        enterRoomBtn.style.display = "inline"
        createRoomBtn.addEventListener("click", createRoom)
        enterRoomBtn.addEventListener("click", renderEnterRoom)
      })
    }
  })
}
updateState()

//Sends a message to the background script to create a room
function createRoom() {
  chrome.runtime.sendMessage({ action: "createRoom" })
}

//Renders the html form to input the desired room id to enter
function renderEnterRoom() {
  var child = container.lastElementChild;
  while (child) {
    container.removeChild(child);
    child = container.lastElementChild;
  }

  const roomCodeInput = document.createElement("input")
  roomCodeInput.placeholder = "Enter room code..."
  roomCodeInput.id = "roomIdInput"
  roomCodeInput.className = "form-control bg-dark text-white"

  const button = document.createElement("button")
  button.id = "submitEnterBtn"
  button.className = "btn btn-primary"
  button.textContent = "Enter"
  button.addEventListener("click", enterRoom)

  container.appendChild(roomCodeInput)
  container.appendChild(button)
}

//Sends a message to the background script to enter a room with a given id
function enterRoom() {
  let roomId = document.getElementById("roomIdInput").value
  chrome.runtime.sendMessage({ action: "enterRoom", payload: roomId })
}