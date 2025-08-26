import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import type { Event } from '../../services/api';
import './Events.scss';

interface CreateEventForm {
  title: string;
  content: string;
  type: 'event' | 'thought';
  emotionalReactions: string[];
}

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState<CreateEventForm>({
    title: '',
    content: '',
    type: 'event',
    emotionalReactions: [],
  });

  // Allowed emotions must match backend EmotionalReaction enum
  const emotions = ['😁', '😢', '🤩', '😌', '😠', '😲', '🥰', '😕', '😎', '🙏', '🔥', '👍'];

  useEffect(() => {
    console.log('Events component mounted');
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      console.log('Fetching events...');
      setLoading(true);
      setError(null);
      
      const events = await apiService.getEvents();
      console.log('Events fetched:', events);
      
      // Проверяем, что events это массив
      if (Array.isArray(events)) {
        setEvents(events);
      } else {
        console.error('Events is not an array:', events);
        setError('Неверный формат данных от сервера');
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Ошибка загрузки событий');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Strictly send only whitelisted DTO fields; ensure types match
      const { emotionalReactions, ...rest } = formData;
      const eventData = {
        ...rest,
        emotionalReactions,
        eventDate: selectedDate.toISOString(),
        isPrivate: false,
      };

      const newEvent = await apiService.createEvent(eventData);
      setEvents(prev => [newEvent, ...prev]);
      
      // Сброс формы
      setFormData({
        title: '',
        content: '',
        type: 'event',
        emotionalReactions: [],
      });
      setShowForm(false);
    } catch (error: any) {
      console.error('Error creating event:', error?.response?.data || error);
      setError(error?.response?.data?.message || 'Ошибка создания события');
    }
  };

  const handleInputChange = (field: keyof CreateEventForm, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleEmotion = (emotion: string) => {
    setFormData(prev => ({
      ...prev,
      emotionalReactions: prev.emotionalReactions.includes(emotion)
        ? prev.emotionalReactions.filter(e => e !== emotion)
        : [...prev.emotionalReactions, emotion]
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventsForDate = (date: Date) => {
    if (!Array.isArray(events)) {
      return [];
    }
    return events.filter(event => {
      const eventDate = new Date(event.createdAt);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  console.log('Events component rendering, loading:', loading, 'error:', error, 'events count:', events.length, 'events type:', typeof events);

  return (
    <div className="events">
      <div className="events__header">
        <h1>События и мысли</h1>
        <div className="date-selector">
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
          />
        </div>
        <button 
          className="btn btn--primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Отмена' : 'Добавить запись'}
        </button>
      </div>

      <div className="events__content">
        {loading && (
          <div className="events__loading">Загрузка событий...</div>
        )}

        {error && (
          <div className="events__error">
            <p>{error}</p>
            <button onClick={fetchEvents} className="btn btn--primary">
              Попробовать снова
            </button>
          </div>
        )}

        {showForm && (
          <div className="event-form">
            <h3>Новая запись</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Заголовок</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Тип</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                >
                  <option value="event">Событие</option>
                  <option value="thought">Мысль</option>
                </select>
              </div>

              <div className="form-group">
                <label>Содержание</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  required
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Эмоциональные реакции</label>
                <div className="emotions-selector">
                  {emotions.map(emotion => (
                    <button
                      key={emotion}
                      type="button"
                      className={`emotion-btn ${formData.emotionalReactions.includes(emotion) ? 'selected' : ''}`}
                      onClick={() => toggleEmotion(emotion)}
                    >
                      {emotion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn--primary">
                  Сохранить
                </button>
                <button 
                  type="button" 
                  className="btn btn--secondary"
                  onClick={() => setShowForm(false)}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="events__list">
          <h3>Записи за {selectedDate.toLocaleDateString('ru-RU', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}</h3>
          
          {getEventsForDate(selectedDate).length === 0 ? (
            <div className="no-events">
              <p>На этот день записей нет</p>
              <button 
                className="btn btn--primary"
                onClick={() => setShowForm(true)}
              >
                Добавить запись
              </button>
            </div>
          ) : (
            <div className="events-list">
              {getEventsForDate(selectedDate).map((event) => (
                <div key={event.id} className="event-item">
                  <div className="event-header">
                    <div className="event-type">
                      {event.type === 'event' ? '📅' : '💭'}
                    </div>
                    <div className="event-title">{event.title}</div>
                    <div className="event-time">
                      {formatDate(event.createdAt)}
                    </div>
                  </div>
                  
                  <div className="event-content">{event.content}</div>
                  
                  {event.emotionalReactions && event.emotionalReactions.length > 0 && (
                    <div className="event-reactions">
                      <span className="reactions-label">Реакции:</span>
                      {event.emotionalReactions.map((reaction, index) => (
                        <span key={index} className="reaction">{reaction}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Events; 