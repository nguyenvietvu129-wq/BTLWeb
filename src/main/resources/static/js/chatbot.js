let chatbotEls = {};
let chatbotOpen = false;
let chatting = false;

function initChatbotWidget() {
  const token = localStorage.getItem('token');
  const widget = document.getElementById('chatbot-widget');
  if (!widget) return;

  chatbotEls = {
    openBtn: document.getElementById('chatbot-open-btn'),
    panel: document.getElementById('chatbot-panel'),
    closeBtn: document.getElementById('chatbot-close-btn'),
    messages: document.getElementById('chatbot-messages'),
    input: document.getElementById('chatbot-input'),
    sendBtn: document.getElementById('chatbot-send-btn'),
    status: document.getElementById('chatbot-status')
  };

  // Nếu chưa login thì vẫn cho mở UI nhưng sẽ redirect khi gửi
  if (!token) {
    setStatus('Bạn cần đăng nhập để sử dụng chatbot.');
  }

  if (chatbotEls.openBtn) {
    chatbotEls.openBtn.addEventListener('click', () => toggleChatbot(true));
  }

  if (chatbotEls.closeBtn) {
    chatbotEls.closeBtn.addEventListener('click', () => toggleChatbot(false));
  }

  if (chatbotEls.sendBtn) {
    chatbotEls.sendBtn.addEventListener('click', () => sendMessage());
  }

  if (chatbotEls.input) {
    chatbotEls.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
}

function toggleChatbot(open) {
  chatbotOpen = open;
  const { openBtn, panel } = chatbotEls;
  if (!panel || !openBtn) return;

  if (open) {
    openBtn.style.display = 'none';
    panel.style.display = 'block';
    // Focus input
    if (chatbotEls.input) chatbotEls.input.focus();
  } else {
    panel.style.display = 'none';
    openBtn.style.display = 'flex';
  }
}

function addMessage(role, text) {
  if (!chatbotEls.messages) return;
  const item = document.createElement('div');
  item.className = `chat-item ${role}`;

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;

  item.appendChild(bubble);
  chatbotEls.messages.appendChild(item);
  chatbotEls.messages.scrollTop = chatbotEls.messages.scrollHeight;
}

function setStatus(msg) {
  if (chatbotEls.status) chatbotEls.status.textContent = msg || '';
}

async function sendMessage() {
  if (chatting) return;
  const token = localStorage.getItem('token');

  if (!token) {
    alert('Vui lòng đăng nhập để sử dụng chatbot!');
    window.location.href = '/login?redirect=/' ;
    return;
  }

  const input = chatbotEls.input;
  if (!input) return;

  const message = (input.value || '').trim();
  if (!message) return;

  chatting = true;
  input.value = '';
  setStatus('Đang nhận phản hồi...');

  addMessage('user', message);

  try {
    const res = await fetch('/api/chatbot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message })
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errMsg = data?.error || data?.message || `Lỗi ${res.status}`;
      addMessage('bot', `Xin lỗi, ${errMsg}`);
      setStatus('');
      return;
    }

    const reply = data?.data?.reply || data?.data?.message || data?.message || 'Không có phản hồi.';
    addMessage('bot', reply);
    setStatus('');
  } catch (e) {
    console.error(e);
    addMessage('bot', 'Lỗi kết nối tới máy chủ chatbot. Vui lòng thử lại sau.');
    setStatus('');
  } finally {
    chatting = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initChatbotWidget();
  // Mặc định đóng panel
  const panel = document.getElementById('chatbot-panel');
  const openBtn = document.getElementById('chatbot-open-btn');
  if (panel) panel.style.display = 'none';
  if (openBtn) openBtn.style.display = 'flex';
});

