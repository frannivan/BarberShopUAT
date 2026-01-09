import { Component, inject, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CRMService } from '../../services/crm.service';

interface Message {
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
    <div class="chatbot-wrapper" [class.open]="isOpen()">
      <!-- Chat Toggle Button -->
      <button class="chat-toggle shadow-lg" (click)="toggleChat()">
        <span *ngIf="!isOpen()"><i class="fas fa-comments mr-2"></i> ¿Dudas?</span>
        <span *ngIf="isOpen()"><i class="fas fa-times"></i></span>
      </button>

      <!-- Chat Container -->
      <div class="chat-container shadow-2xl animate-fade-in" *ngIf="isOpen()">
        <div class="chat-header">
          <div class="header-content">
            <div class="avatar-ring">
              <i class="fas fa-robot"></i>
            </div>
            <div class="status-info">
              <h6 class="m-0 font-weight-bold">Asistente Premium</h6>
              <div class="online-status">
                <span class="pulse-dot"></span>
                <small>En línea</small>
              </div>
            </div>
            <button class="minimize-btn" (click)="toggleChat()" title="Minimizar">
              <i class="fas fa-chevron-down"></i>
            </button>
          </div>
        </div>

        <div class="chat-messages p-3" #scrollMe>
          <div *ngFor="let msg of messages()" 
               [ngClass]="{'user-msg': msg.sender === 'user', 'bot-msg': msg.sender === 'bot'}" 
               class="message-bubble animate-slide-up">
            <div class="msg-content">{{ msg.text }}</div>
            <div class="msg-time">{{ msg.timestamp | date:'shortTime' }}</div>
          </div>
        </div>

        <div class="chat-footer p-3 bg-white border-top">
          <div class="input-container">
            <input type="text" 
                   class="chat-input" 
                   placeholder="Escribe tu mensaje..." 
                   [(ngModel)]="userInput" 
                   (keyup.enter)="sendMessage()">
            <button class="send-btn" (click)="sendMessage()" [disabled]="!userInput.trim()" title="Enviar">
              <i class="fas fa-user"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(231, 76, 60, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(231, 76, 60, 0); }
    }
    @keyframes slideUp {
      from { transform: translateY(10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .chatbot-wrapper { position: fixed; bottom: 30px; right: 30px; z-index: 10000; font-family: 'Montserrat', sans-serif; }
    
    .chat-toggle {
      background: var(--gradient-red, linear-gradient(135deg, #e74c3c 0%, #c0392b 100%));
      color: white; border: none; padding: 15px 25px;
      border-radius: 50px; cursor: pointer; 
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      border: 1px solid rgba(255,255,255,0.1);
      display: flex; align-items: center; gap: 10px;
      font-weight: 700;
    }
    .chat-toggle:hover { transform: translateY(-5px) scale(1.05); box-shadow: 0 10px 20px rgba(231, 76, 60, 0.3); }

    .chat-container {
      position: absolute; bottom: 85px; right: 0; width: 360px; height: 500px;
      background: rgba(42, 42, 42, 0.95); backdrop-filter: blur(15px);
      border-radius: 24px; display: flex; flex-direction: column; overflow: hidden;
      border: 1px solid rgba(255,255,255,0.1);
      transform-origin: bottom right;
      box-shadow: 0 15px 35px rgba(0,0,0,0.4);
    }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }

    .chat-header {
      background: var(--gradient-red, linear-gradient(135deg, #e74c3c 0%, #c0392b 100%));
      color: white; padding: 20px;
    }
    .header-content { display: flex; align-items: center; gap: 12px; position: relative; }
    .avatar-ring {
      width: 40px; height: 40px; background: rgba(255,255,255,0.2);
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 20px; border: 1px solid rgba(255,255,255,0.3);
    }
    .status-info h6 { font-size: 16px; margin: 0; letter-spacing: -0.02em; font-weight: 700; }
    .online-status { display: flex; align-items: center; gap: 6px; }
    .pulse-dot {
      width: 8px; height: 8px; background: #fff; border-radius: 50%;
      animation: pulse 2s infinite;
    }
    .minimize-btn { 
      margin-left: auto; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.3); color: white;
      width: 32px; height: 32px; border-radius: 50%;
      cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; justify-content: center;
    }
    .minimize-btn:hover { background: rgba(0,0,0,0.7); transform: scale(1.1); }

    .chat-messages { flex: 1; overflow-y: auto; background: rgba(30,30,30,0.4); display: flex; flex-direction: column; gap: 12px; }
    .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }

    .message-bubble {
      max-width: 85%; padding: 12px 16px; border-radius: 18px; position: relative;
      font-size: 14px; line-height: 1.5; box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    .bot-msg { 
      background: rgba(255,255,255,0.1); color: #eee; align-self: flex-start; 
      border-bottom-left-radius: 4px; border: 1px solid rgba(255,255,255,0.05);
    }
    .user-msg { 
      background: var(--gradient-red, #e74c3c); color: white; align-self: flex-end; 
      border-bottom-right-radius: 4px;
    }
    .msg-time { font-size: 10px; opacity: 0.5; margin-top: 6px; }
    .user-msg .msg-time { color: rgba(255,255,255,0.8); text-align: right; }

    .chat-footer { background: #2a2a2a; border-top: 1px solid rgba(255,255,255,0.1) !important; }
    .input-container {
      display: flex; align-items: center; background: rgba(255,255,255,0.05);
      padding: 8px 12px; border-radius: 16px; gap: 8px;
      transition: all 0.3s; border: 1px solid rgba(255,255,255,0.1);
    }
    .input-container:focus-within { background: rgba(255,255,255,0.08); border-color: var(--accent-red, #e74c3c); }
    .chat-input {
      flex: 1; border: none; background: none; padding: 8px 0;
      font-size: 14px; outline: none; color: white;
    }
    .send-btn {
      background: var(--gradient-red, #e74c3c); color: white; width: 40px; height: 40px;
      border: none; border-radius: 12px; cursor: pointer; transition: all 0.3s;
      display: flex; align-items: center; justify-content: center;
      padding: 0;
    }
    .send-btn:hover:not(:disabled) { transform: scale(1.1) translateY(-2px); box-shadow: 0 5px 15px rgba(231, 76, 60, 0.4); }
    .send-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  `]
})
export class ChatbotComponent implements AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  isOpen = signal(false);
  messages = signal<Message[]>([
    { text: '¡Hola! Soy el asistente de BarberShop. ¿En qué puedo ayudarte hoy?', sender: 'bot', timestamp: new Date() }
  ]);
  userInput = '';
  leadCaptured = false;
  userData: any = {};

  private crmService = inject(CRMService);

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  toggleChat() {
    this.isOpen.set(!this.isOpen());
    setTimeout(() => this.scrollToBottom(), 100);
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    const userMsg = this.userInput;
    this.messages.update(m => [...m, { text: userMsg, sender: 'user', timestamp: new Date() }]);
    this.userInput = '';

    // Auto scroll happens via ngAfterViewChecked, but explicit call helps
    setTimeout(() => this.scrollToBottom(), 50);

    setTimeout(() => {
      this.processAIResponse(userMsg);
    }, 1000);
  }

  processAIResponse(text: string) {
    const lowerText = text.toLowerCase();
    let botResponse = '';

    if (!this.leadCaptured) {
      if (lowerText.includes('hola') || lowerText.includes('precio') || lowerText.includes('servicios') || lowerText.includes('tinte') || lowerText.includes('barba')) {
        botResponse = 'Claro, manejamos cortes premium, afeitado tradicional y tintes. Para darte una atención personalizada, ¿podrías dejarme tu nombre y teléfono?';
        this.askForLead();
      } else if (this.waitingForData) {
        this.handleLeadData(text);
        return;
      } else {
        botResponse = 'Interesante. Para agendar o darte precios exactos, prefiero contactarte directamente. ¿Cuál es tu nombre?';
        this.waitingForData = 'name';
      }
    } else {
      botResponse = '¡Gracias! Un barbero experto te contactará en breve. ¿Deseas ver nuestra galería mientras tanto?';
    }

    if (botResponse) {
      this.messages.update(m => [...m, { text: botResponse, sender: 'bot', timestamp: new Date() }]);
      setTimeout(() => this.scrollToBottom(), 50);
    }
  }

  waitingForData: 'name' | 'phone' | null = null;

  askForLead() {
    this.waitingForData = 'name';
  }

  handleLeadData(text: string) {
    if (this.waitingForData === 'name') {
      this.userData.name = text;
      this.waitingForData = 'phone';
      this.messages.update(m => [...m, { text: `Mucho gusto ${text}. ¿Y tu número de WhatsApp para contactarte?`, sender: 'bot', timestamp: new Date() }]);
    } else if (this.waitingForData === 'phone') {
      this.userData.phone = text;
      this.waitingForData = null;
      this.leadCaptured = true;
      this.saveLead();
      this.messages.update(m => [...m, { text: '¡Perfecto! Ya registré tu interés. Pronto recibirás un mensaje.', sender: 'bot', timestamp: new Date() }]);
    }
    setTimeout(() => this.scrollToBottom(), 50);
  }

  saveLead() {
    const lead = {
      name: this.userData.name,
      phone: this.userData.phone,
      interest: 'Inquiry via Chatbot',
      source: 'CHATBOT'
    };

    this.crmService.createLead(lead).subscribe({
      next: (res) => console.log('Lead captured:', res),
      error: (err) => console.error('Error saving lead:', err)
    });
  }
}
