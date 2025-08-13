# 📁 Перенос файлов на Linux сервер

## 🔄 Способы переноса

### 1. Git (Рекомендуется)
```bash
# На Linux сервере:
cd /opt
git clone https://github.com/your-username/mindarity.git mindarity
cd mindarity
```

### 2. SCP (Secure Copy)
```bash
# Из Windows PowerShell или Linux:
scp -r server-setup/ root@YOUR_SERVER_IP:/opt/mindarity/
```

### 3. SFTP
```bash
# Используйте FileZilla или другой SFTP клиент
# Подключитесь к серверу и загрузите папку server-setup/
```

### 4. Rsync (если доступен)
```bash
rsync -avz server-setup/ root@YOUR_SERVER_IP:/opt/mindarity/server-setup/
```

## ✅ После переноса на Linux сервер

### 1. Проверка файлов
```bash
cd /opt/mindarity
ls -la server-setup/
```

### 2. Настройка прав доступа
```bash
# Делаем все скрипты исполняемыми
chmod +x server-setup/*.sh

# Проверяем права доступа
ls -la server-setup/*.sh
```

### 3. Проверка содержимого
```bash
# Проверяем, что все файлы на месте
tree server-setup/ || ls -la server-setup/
```

## 🚀 Запуск настройки

### Полная настройка
```bash
./server-setup/setup-server.sh full
```

### Пошаговая настройка
```bash
# Этап 1: Docker
./server-setup/setup-server.sh install-docker

# Этап 2: SSL
./server-setup/setup-server.sh setup-ssl

# Этап 3: Развертывание
./server-setup/setup-server.sh deploy
```

## 📋 Структура файлов на сервере

После переноса у вас должна быть следующая структура:
```
/opt/mindarity/
├── server-setup/
│   ├── README.md
│   ├── QUICK_START.md
│   ├── INSTALLATION_GUIDE.md
│   ├── SECURITY.md
│   ├── env.production
│   ├── setup-server.sh
│   ├── install-docker.sh
│   ├── setup-ssl.sh
│   └── deploy.sh
├── docker-compose.yml
├── nginx/
├── backend/
├── frontend/
└── ...
```

## ⚠️ Важные замечания

1. **Права доступа**: Все скрипты должны быть исполняемыми (`chmod +x`)
2. **Переводы строк**: Убедитесь, что файлы используют Unix переводы строк (LF, не CRLF)
3. **Кодировка**: Используйте UTF-8 для всех текстовых файлов
4. **Проверка**: Всегда проверяйте содержимое файлов после переноса

## 🔧 Устранение проблем

### Проблема с правами доступа
```bash
chmod +x server-setup/*.sh
```

### Проблема с переводами строк
```bash
# Установка dos2unix (если нужно)
apt install dos2unix

# Конвертация файлов
dos2unix server-setup/*.sh
```

### Проблема с кодировкой
```bash
# Проверка кодировки
file server-setup/*.sh

# Конвертация в UTF-8 (если нужно)
iconv -f WINDOWS-1251 -t UTF-8 file.txt > file_utf8.txt
```
