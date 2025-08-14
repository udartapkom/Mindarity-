import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/useAuth';
import apiService, { Event } from '../../services/api';
import './Events.scss';

interface CreateEventForm {
  title: string;
  content: string;
  type: 'event' | 'thought';
  mood: string;
  weather: string;
  location: string;
  tags: string;
}

const Events: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState<CreateEventForm>({
    title: '',
    content: '',
    type: 'event',
    mood: '😊',
    weather: '☀️',
    location: '',
    tags: '',
  });

  const moods = ['😊', '😢', '😡', '😴', '🤔', '😍', '😱', '👍', '👎', '🔥'];
  const weatherOptions = ['☀️', '☁️', '🌧️', '❄️', '🌪️', '🌈', '🌙'];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const events = await apiService.getEvents();
      setEvents(events);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const eventData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        emotionalReactions: [formData.mood],
        eventDate: new Date().toISOString(),
        isPrivate: false,
      };

      const newEvent = await apiService.createEvent(eventData);
      setEvents(prev => [newEvent, ...prev]);
      
      // Сброс формы и обновление списка
      setFormData({
        title: '',
        content: '',
        type: 'event',
        mood: '😊',
        weather: '☀️',
        location: '',
        tags: '',
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleInputChange = (field: keyof CreateEventForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    return events.filter(event => {
      const eventDate = new Date(event.createdAt);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const renderCalendar = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const calendarDays = [];
    
    // Добавляем пустые дни в начале месяца
    for (let i = 0; i < startingDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    // Добавляем дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayEvents = getEventsForDate(date);
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const isToday = date.toDateString() === currentDate.toDateString();
      
      calendarDays.push(
        <div
          key={day}
          className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <span className="day-number">{day}</span>
          {dayEvents.length > 0 && (
            <div className="event-indicator">
              <span className="event-count">{dayEvents.length}</span>
            </div>
          )}
        </div>
      );
    }

    return calendarDays;
  };

  if (loading) {
    return (
      <div className="events">
        <div className="events__loading">Загрузка событий...</div>
      </div>
    );
  }

  return (
    <div className="events">
      <div className="events__header">
        <h1>События и мысли</h1>
        <button 
          className="btn btn--primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Отмена' : 'Добавить событие'}
        </button>
      </div>

      <div className="events__content">
        <div className="events__calendar">
          <h3>Календарь</h3>
          <div className="calendar">
            <div className="calendar-header">
              <button 
                className="calendar-nav"
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setSelectedDate(newDate);
                }}
              >
                ←
              </button>
              <h4>
                {selectedDate.toLocaleDateString('ru-RU', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h4>
              <button 
                className="calendar-nav"
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setSelectedDate(newDate);
                }}
              >
                →
              </button>
            </div>
            <div className="calendar-grid">
              <div className="calendar-weekdays">
                <div>Пн</div>
                <div>Вт</div>
                <div>Ср</div>
                <div>Чт</div>
                <div>Пт</div>
                <div>Сб</div>
                <div>Вс</div>
              </div>
              <div className="calendar-days">
                {renderCalendar()}
              </div>
            </div>
          </div>
        </div>

        <div className="events__main">
          {showForm && (
            <div className="event-form">
              <h3>Новое событие</h3>
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

                <div className="form-row">
                  <div className="form-group">
                    <label>Настроение</label>
                    <div className="emoji-selector">
                      {moods.map(mood => (
                        <button
                          key={mood}
                          type="button"
                          className={`emoji-option ${formData.mood === mood ? 'selected' : ''}`}
                          onClick={() => handleInputChange('mood', mood)}
                        >
                          {mood}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Погода</label>
                    <div className="emoji-selector">
                      {weatherOptions.map(weather => (
                        <button
                          key={weather}
                          type="button"
                          className={`emoji-option ${formData.weather === weather ? 'selected' : ''}`}
                          onClick={() => handleInputChange('weather', weather)}
                        >
                          {weather}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Местоположение</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Где это произошло?"
                    />
                  </div>

                  <div className="form-group">
                    <label>Теги</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => handleInputChange('tags', e.target.value)}
                      placeholder="тег1, тег2, тег3"
                    />
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
            <h3>События за {selectedDate.toLocaleDateString('ru-RU', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}</h3>
            
            {getEventsForDate(selectedDate).length === 0 ? (
              <div className="no-events">
                <p>На этот день событий не запланировано</p>
                <button 
                  className="btn btn--primary"
                  onClick={() => setShowForm(true)}
                >
                  Добавить событие
                </button>
              </div>
            ) : (
              <div className="events-grid">
                {getEventsForDate(selectedDate).map((event) => (
                  <div key={event.id} className="event-card">
                    <div className="event-card__header">
                      <div className="event-card__type">
                        {event.type === 'event' ? '📅' : '💭'}
                      </div>
                      <div className="event-card__mood">{event.mood}</div>
                      {event.weather && (
                        <div className="event-card__weather">{event.weather}</div>
                      )}
                    </div>
                    
                    <div className="event-card__title">{event.title}</div>
                    <div className="event-card__content">{event.content}</div>
                    
                    {event.location && (
                      <div className="event-card__location">
                        📍 {event.location}
                      </div>
                    )}
                    
                    {event.tags.length > 0 && (
                      <div className="event-card__tags">
                        {event.tags.map(tag => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                    )}
                    
                    <div className="event-card__time">
                      {formatDate(event.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events; 