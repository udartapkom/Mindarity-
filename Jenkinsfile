pipeline {
    agent any
    
    environment {
        // Версия проекта
        PROJECT_VERSION = "${env.BUILD_NUMBER}"
        PROJECT_NAME = "Mindarity"
        
        // Docker образы
        BACKEND_IMAGE = "mindarity-backend"
        FRONTEND_IMAGE = "mindarity-frontend"
        NGINX_IMAGE = "mindarity-nginx"
        
        // Регистр Docker
        DOCKER_REGISTRY = "your-registry.com"
        
        // Целевые окружения
        DEV_ENVIRONMENT = "dev"
        STAGING_ENVIRONMENT = "staging"
        PROD_ENVIRONMENT = "prod"
        
        // Slack уведомления
        SLACK_CHANNEL = "#deployments"
    }
    
    options {
        // Сохранять артефакты сборки
        buildDiscarder(logRotator(numToKeepStr: '10'))
        
        // Таймаут для всего pipeline
        timeout(time: 1, unit: 'HOURS')
        
        // Отмена предыдущих сборок
        disableConcurrentBuilds()
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo "🔍 Проверка исходного кода..."
                
                // Очистка рабочего пространства
                cleanWs()
                
                // Клонирование репозитория
                checkout scm
                
                // Получение информации о коммите
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                    
                    env.GIT_BRANCH = sh(
                        script: 'git rev-parse --abbrev-ref HEAD',
                        returnStdout: true
                    ).trim()
                    
                    env.GIT_COMMIT_MESSAGE = sh(
                        script: 'git log -1 --pretty=%B',
                        returnStdout: true
                    ).trim()
                }
                
                echo "✅ Код получен: ${env.GIT_BRANCH}@${env.GIT_COMMIT_SHORT}"
            }
        }
        
        stage('Code Quality') {
            parallel {
                stage('Backend Lint & Test') {
                    steps {
                        echo "🔧 Проверка качества backend кода..."
                        
                        dir('backend') {
                            // Установка зависимостей
                            sh 'npm ci'
                            
                            // Линтинг
                            sh 'npm run lint'
                            
                            // Запуск тестов
                            sh 'npm run test'
                            
                            // Проверка покрытия
                            sh 'npm run test:cov'
                        }
                    }
                    post {
                        always {
                            // Публикация результатов тестов
                            publishTestResults testResultsPattern: 'backend/coverage/**/*.xml'
                            
                            // Публикация отчета о покрытии
                            publishCoverage adapters: [lcovAdapter('backend/coverage/lcov.info')]
                        }
                    }
                }
                
                stage('Frontend Lint & Test') {
                    steps {
                        echo "🔧 Проверка качества frontend кода..."
                        
                        dir('frontend') {
                            // Установка зависимостей
                            sh 'npm ci'
                            
                            // Линтинг
                            sh 'npm run lint'
                            
                            // Запуск тестов
                            sh 'npm run test'
                            
                            // Сборка для проверки
                            sh 'npm run build'
                        }
                    }
                    post {
                        always {
                            // Публикация результатов тестов
                            publishTestResults testResultsPattern: 'frontend/coverage/**/*.xml'
                        }
                    }
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                echo "🛡️ Сканирование безопасности..."
                
                script {
                    // Сканирование зависимостей
                    sh 'npm audit --audit-level moderate'
                    
                    // Сканирование Docker образов
                    sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v ${WORKSPACE}:/workspace aquasec/trivy image --severity HIGH,CRITICAL ${BACKEND_IMAGE}:${PROJECT_VERSION}'
                    sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v ${WORKSPACE}:/workspace aquasec/trivy image --severity HIGH,CRITICAL ${FRONTEND_IMAGE}:${PROJECT_VERSION}'
                }
            }
        }
        
        stage('Build Docker Images') {
            steps {
                echo "🐳 Сборка Docker образов..."
                
                script {
                    // Сборка backend образа
                    sh "docker build -t ${BACKEND_IMAGE}:${PROJECT_VERSION} -t ${BACKEND_IMAGE}:latest ./backend"
                    
                    // Сборка frontend образа
                    sh "docker build -t ${FRONTEND_IMAGE}:${PROJECT_VERSION} -t ${FRONTEND_IMAGE}:latest ./frontend"
                    
                    // Сборка nginx образа
                    sh "docker build -t ${NGINX_IMAGE}:${PROJECT_VERSION} -t ${NGINX_IMAGE}:latest ./nginx"
                    
                    // Тегирование для продакшна
                    if (env.GIT_BRANCH == 'main' || env.GIT_BRANCH == 'master') {
                        sh "docker tag ${BACKEND_IMAGE}:${PROJECT_VERSION} ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:${PROJECT_VERSION}"
                        sh "docker tag ${FRONTEND_IMAGE}:${PROJECT_VERSION} ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:${PROJECT_VERSION}"
                        sh "docker tag ${NGINX_IMAGE}:${PROJECT_VERSION} ${DOCKER_REGISTRY}/${NGINX_IMAGE}:${PROJECT_VERSION}"
                    }
                }
            }
        }
        
        stage('Push to Registry') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }
            steps {
                echo "📤 Отправка образов в registry..."
                
                script {
                    // Авторизация в registry
                    withCredentials([usernamePassword(credentialsId: 'docker-registry', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh "docker login ${DOCKER_REGISTRY} -u ${DOCKER_USER} -p ${DOCKER_PASS}"
                        
                        // Отправка образов
                        sh "docker push ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:${PROJECT_VERSION}"
                        sh "docker push ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:${PROJECT_VERSION}"
                        sh "docker push ${DOCKER_REGISTRY}/${NGINX_IMAGE}:${PROJECT_VERSION}"
                        
                        // Отправка latest тегов
                        sh "docker push ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:latest"
                        sh "docker push ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:latest"
                        sh "docker push ${DOCKER_REGISTRY}/${NGINX_IMAGE}:latest"
                    }
                }
            }
        }
        
        stage('Deploy to Dev') {
            when {
                branch 'develop'
            }
            steps {
                echo "🚀 Развертывание в DEV окружение..."
                
                script {
                    // Обновление версии в интерфейсе
                    updateVersionInInterface(env.DEV_ENVIRONMENT)
                    
                    // Развертывание через Docker Compose
                    sh "cd ${WORKSPACE} && docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build"
                    
                    // Проверка health check
                    sh "sleep 30 && curl -f http://dev.mindarity.ru/health || exit 1"
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'main'
            }
            steps {
                echo "🚀 Развертывание в STAGING окружение..."
                
                script {
                    // Обновление версии в интерфейсе
                    updateVersionInInterface(env.STAGING_ENVIRONMENT)
                    
                    // Развертывание через Docker Compose
                    sh "cd ${WORKSPACE} && docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d --build"
                    
                    // Проверка health check
                    sh "sleep 30 && curl -f http://staging.mindarity.ru/health || exit 1"
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                echo "🚀 Развертывание в PRODUCTION окружение..."
                
                script {
                    // Подтверждение развертывания
                    input message: 'Подтвердите развертывание в PRODUCTION?', ok: 'Развернуть'
                    
                    // Обновление версии в интерфейсе
                    updateVersionInInterface(env.PROD_ENVIRONMENT)
                    
                    // Развертывание через Docker Compose
                    sh "cd ${WORKSPACE} && docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build"
                    
                    // Проверка health check
                    sh "sleep 30 && curl -f https://mindarity.ru/health || exit 1"
                    
                    // Создание тега релиза
                    sh "git tag -a v${PROJECT_VERSION} -m 'Release version ${PROJECT_VERSION}'"
                    sh "git push origin v${PROJECT_VERSION}"
                }
            }
        }
        
        stage('Post-Deployment Tests') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                echo "🧪 Пост-деплой тесты..."
                
                script {
                    // Определение URL для тестирования
                    def testUrl = ""
                    if (env.GIT_BRANCH == 'main') {
                        testUrl = "https://mindarity.ru"
                    } else if (env.GIT_BRANCH == 'develop') {
                        testUrl = "http://dev.mindarity.ru"
                    }
                    
                    // Smoke тесты
                    sh "curl -f ${testUrl}/health || exit 1"
                    sh "curl -f ${testUrl}/api || exit 1"
                    
                    // API тесты
                    sh "npm run test:e2e -- --baseUrl=${testUrl}"
                }
            }
        }
    }
    
    post {
        always {
            echo "🧹 Очистка рабочего пространства..."
            
            // Очистка Docker образов
            sh "docker image prune -f"
            
            // Очистка контейнеров
            sh "docker container prune -f"
            
            // Очистка volumes
            sh "docker volume prune -f"
        }
        
        success {
            echo "✅ Pipeline выполнен успешно!"
            
            // Уведомление в Slack
            slackSend(
                channel: env.SLACK_CHANNEL,
                color: 'good',
                message: "✅ ${env.PROJECT_NAME} v${env.PROJECT_VERSION} успешно развернут в ${env.GIT_BRANCH} окружение"
            )
            
            // Обновление версии в интерфейсе
            script {
                if (env.GIT_BRANCH == 'main') {
                    updateVersionInInterface(env.PROD_ENVIRONMENT)
                } else if (env.GIT_BRANCH == 'develop') {
                    updateVersionInInterface(env.DEV_ENVIRONMENT)
                }
            }
        }
        
        failure {
            echo "❌ Pipeline завершился с ошибкой!"
            
            // Уведомление в Slack
            slackSend(
                channel: env.SLACK_CHANNEL,
                color: 'danger',
                message: "❌ ${env.PROJECT_NAME} v${env.PROJECT_VERSION} - ошибка в pipeline на ветке ${env.GIT_BRANCH}"
            )
            
            // Откат к предыдущей версии
            script {
                if (env.GIT_BRANCH == 'main') {
                    rollbackToPreviousVersion(env.PROD_ENVIRONMENT)
                } else if (env.GIT_BRANCH == 'develop') {
                    rollbackToPreviousVersion(env.DEV_ENVIRONMENT)
                }
            }
        }
        
        cleanup {
            echo "🧹 Очистка завершена"
        }
    }
}

// Функция обновления версии в интерфейсе
def updateVersionInInterface(environment) {
    echo "🔄 Обновление версии в интерфейсе для ${environment}..."
    
    // Создание файла с версией
    sh """
        echo '{
            "version": "${env.PROJECT_VERSION}",
            "buildNumber": "${env.BUILD_NUMBER}",
            "commit": "${env.GIT_COMMIT_SHORT}",
            "branch": "${env.GIT_BRANCH}",
            "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
            "environment": "${environment}"
        }' > version.json
    """
    
    // Копирование в соответствующий контейнер
    if (environment == env.PROD_ENVIRONMENT) {
        sh "docker cp version.json mindarity-frontend:/app/public/version.json"
    } else if (environment == env.DEV_ENVIRONMENT) {
        sh "docker cp version.json mindarity-frontend:/app/public/version.json"
    }
}

// Функция отката к предыдущей версии
def rollbackToPreviousVersion(environment) {
    echo "🔄 Откат к предыдущей версии для ${environment}..."
    
    // Получение предыдущей версии
    def previousVersion = sh(
        script: "docker images ${BACKEND_IMAGE} --format '{{.Tag}}' | grep -v latest | sort -V | tail -2 | head -1",
        returnStdout: true
    ).trim()
    
    if (previousVersion) {
        echo "Откат к версии: ${previousVersion}"
        
        // Обновление docker-compose файла
        sh "sed -i 's/image: ${BACKEND_IMAGE}:.*/image: ${BACKEND_IMAGE}:${previousVersion}/g' docker-compose.yml"
        sh "sed -i 's/image: ${FRONTEND_IMAGE}:.*/image: ${FRONTEND_IMAGE}:${previousVersion}/g' docker-compose.yml"
        sh "sed -i 's/image: ${NGINX_IMAGE}:.*/image: ${NGINX_IMAGE}:${previousVersion}/g' docker-compose.yml"
        
        // Перезапуск сервисов
        sh "docker-compose up -d"
        
        // Уведомление об откате
        slackSend(
            channel: env.SLACK_CHANNEL,
            color: 'warning',
            message: "⚠️ ${env.PROJECT_NAME} откачен к версии ${previousVersion} в ${environment} окружении"
        )
    }
}
