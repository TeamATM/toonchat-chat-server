# Toonchat Chatting Server

Welcome to our project! We've created an immersive, AI-powered chat experience that lets you interact with characters from your favorite webtoons. By harnessing the capabilities of a Large Language Model, our application generates dynamic responses from the characters you chat with. Please note, due to the time required for AI inference, this isn't a real-time interaction.
<br>
<br>
## What Does This Project Offer?
1. AI-Powered Conversations: You can engage in text-based chats with webtoon characters!  
Our advanced AI model dynamically generates their responses based on conversation context and relevant story content.
2. Efficient Communication via WebSockets: Although we can't offer real-time interaction due to  
inference delay, we use WebSockets (socket.io) for swift bidirectional communication between your client and our server.
3. Story Content Retrieval: Our application doesn't just look at past chats; it digs deeper!  
Using MongoDB's vector search capabilities, it retrieves pertinent story content about the webtoon you're interacting with.  
This enriches your conversations and lets you explore your favorite stories in more depth.
4. Asynchronous Chat Processing: We handle high volumes of messages effectively by using a message queue for asynchronous processing of chat messages - ensuring smooth system performance even under heavy loads.

<br>

## How To Get Started?
## You'll Need:
- Node.js
- MongoDB
- A WebSocket compatible browser
- Other dependencies from various repositories within our organization.  
Please refer to each repository for specific requirements.

## Steps to Install:
Clone this repository.
```
git clone https://github.com/TeamATM/toonchat-chat-server.git
```
Install NPM packages.
```
npm install
```
Start the server.
```
npm start
```