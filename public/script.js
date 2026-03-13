// document.addEventListener('DOMContentLoaded', () => {
//     const chatBox = document.getElementById('chat-box');
//     const chatForm = document.getElementById('chat-form');
//     const userInput = document.getElementById('user-input');

//     chatForm.addEventListener('submit', async (e) => {
//         e.preventDefault();

//         const userMessage = userInput.value.trim();
//         if (!userMessage) {
//             return;
//         }

//         addMessageToChatBox('user', userMessage);
//         userInput.value = '';

//         const thinkingMessageElement = addMessageToChatBox('bot', 'Thinking...');

//         try {
//             const response = await fetch('/api/chat', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     conversation: [{ role: 'user', text: userMessage }],
//                 }),
//             });

//             if (!response.ok) {
//                 throw new Error('Failed to get response from server.');
//             }

//             const data = await response.json();

//             if (data.result) {
//                 thinkingMessageElement.textContent = data.result;
//             } else {
//                 thinkingMessageElement.textContent = 'Sorry, no response received.';
//             }
//         } catch (error) {
//             console.error('Error fetching chat response:', error);
//             thinkingMessageElement.textContent = 'Failed to get response from server.';
//         } finally {
//             chatBox.scrollTop = chatBox.scrollHeight;
//         }
//     });

//     function addMessageToChatBox(role, text) {
//         const messageElement = document.createElement('div');
//         messageElement.classList.add('chat-message', `${role}-message`);
//         messageElement.textContent = text;
//         chatBox.appendChild(messageElement);
//         chatBox.scrollTop = chatBox.scrollHeight;
//         return messageElement;
//     }
// });


document.addEventListener('DOMContentLoaded', () => {
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');
  const themeToggle = document.getElementById('theme-toggle');
  
  const conversation = [];

  // Theme switching logic
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    themeToggle.textContent = isDarkMode ? '🌙' : '☀️';
  });

  // Load saved theme from localStorage
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = '🌙';
  } else {
    themeToggle.textContent = '☀️';
  }

  function parseMarkdown(text) {
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>');

    const lines = html.split('\n');
    let inList = false;
    html = '';

    lines.forEach(line => {
      if (line.startsWith('* ')) {
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        html += `<li>${line.substring(2)}</li>`;
      } else {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += line ? `${line}<br>` : '<br>';
      }
    });

    if (inList) {
      html += '</ul>';
    }

    html = html.replace(/<br><ul>/g, '<ul>').replace(/<\/ul><br>/g, '</ul>');
    
    return html;
  }

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userMessage = userInput.value.trim();

    if (userMessage === '') {
      return;
    }

    addMessageToChatBox('user', userMessage);
    conversation.push({ role: 'user', text: userMessage });

    userInput.value = '';
    const thinkingMessageElement = addMessageToChatBox('bot', 'Thinking...');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversation }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server.');
      }

      const data = await response.json();

      if (data && data.result) {
        const formattedResponse = parseMarkdown(data.result);
        thinkingMessageElement.innerHTML = formattedResponse;
        conversation.push({ role: 'model', text: data.result });
      } else {
        thinkingMessageElement.textContent = 'Sorry, no response received.';
      }
    } catch (error) {
      console.error('Error fetching AI response:', error);
      thinkingMessageElement.textContent = 'Failed to get response from server.';
    } finally {
        thinkingMessageElement.classList.remove('loading-dots');
    }
  });

  function addMessageToChatBox(role, text) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${role}-message`);

    if (role === 'bot' && text === 'Thinking...') {
      messageElement.classList.add('loading-dots');
      messageElement.innerHTML = '<span></span><span></span><span></span>';
    } else {
      messageElement.textContent = text;
    }
    
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
    return messageElement;
  }
});

