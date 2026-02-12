import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hi! I'm your movie assistant. I can help you find movies, get recommendations, or answer questions about films. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    setTimeout(() => {
      const botResponse = getBotResponse(inputValue);

      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  const getBotResponse = (input) => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('recommend') || lowerInput.includes('suggestion')) {
      return 'Based on popular ratings, I recommend checking out "Stellar Odyssey" - it\'s a fantastic sci-fi adventure with a 4.5 rating! Or if you prefer action, "The Last Stand" is getting rave reviews.';
    }

    if (lowerInput.includes('sci-fi') || lowerInput.includes('science fiction')) {
      return 'Great choice! For sci-fi fans, I highly recommend "Stellar Odyssey" (2024). It has stunning visuals and an engaging story about discovering an ancient alien civilization.';
    }

    if (lowerInput.includes('horror')) {
      return 'If you\'re into horror, you should definitely watch "Midnight Shadows" (2025). It\'s a psychological thriller that builds genuine suspense without relying on cheap jump scares.';
    }

    if (lowerInput.includes('rating') || lowerInput.includes('best')) {
      return 'The highest-rated movie right now is "The Last Stand" with a 4.6 rating, followed by "Stellar Odyssey" at 4.5. Both are excellent choices!';
    }

    return 'I can help you find movies by genre, get personalized recommendations, or answer questions about specific films. What are you interested in?';
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 bg-primary">
            <AvatarFallback className="text-white">AI</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">Movie Assistant</p>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user'
                  ? 'justify-end'
                  : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Ask me anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button onClick={handleSend} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
