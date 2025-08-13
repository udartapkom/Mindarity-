pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'localhost:5000'
        PROJECT_NAME = 'mindarity'
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/${PROJECT_NAME}-backend"
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend"
        VERSION = "${env.BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            parallel {
                stage('Backend Dependencies') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Frontend Dependencies') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }
        
        stage('Run Tests') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            sh 'npm run test'
                            sh 'npm run test:e2e'
                        }
                    }
                }
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            sh 'npm run test'
                        }
                    }
                }
            }
        }
        
        stage('Code Quality') {
            parallel {
                stage('Backend Lint') {
                    steps {
                        dir('backend') {
                            sh 'npm run lint'
                        }
                    }
                }
                stage('Frontend Lint') {
                    steps {
                        dir('frontend') {
                            sh 'npm run lint'
                        }
                    }
                }
            }
        }
        
        stage('Build') {
            parallel {
                stage('Build Backend') {
                    steps {
                        dir('backend') {
                            sh 'npm run build'
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm run build'
                        }
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            parallel {
                stage('Build Backend Image') {
                    steps {
                        script {
                            docker.build("${BACKEND_IMAGE}:${VERSION}", "./backend")
                            docker.build("${BACKEND_IMAGE}:latest", "./backend")
                        }
                    }
                }
                stage('Build Frontend Image') {
                    steps {
                        script {
                            docker.build("${FRONTEND_IMAGE}:${VERSION}", "./frontend")
                            docker.build("${FRONTEND_IMAGE}:latest", "./frontend")
                        }
                    }
                }
            }
        }
        
        stage('Push Images') {
            steps {
                script {
                    docker.withRegistry("http://${DOCKER_REGISTRY}") {
                        docker.image("${BACKEND_IMAGE}:${VERSION}").push()
                        docker.image("${BACKEND_IMAGE}:latest").push()
                        docker.image("${FRONTEND_IMAGE}:${VERSION}").push()
                        docker.image("${FRONTEND_IMAGE}:latest").push()
                    }
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                script {
                    sh "docker-compose -f docker-compose.staging.yml up -d"
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                script {
                    sh "docker-compose -f docker-compose.prod.yml up -d"
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    // Wait for services to start
                    sleep 30
                    
                    // Check backend health
                    sh 'curl -f http://localhost:3000/monitoring/health || exit 1'
                    
                    // Check frontend
                    sh 'curl -f http://localhost:80 || exit 1'
                }
            }
        }
    }
    
    post {
        always {
            // Cleanup
            sh 'docker system prune -f'
            
            // Archive artifacts
            archiveArtifacts artifacts: '**/dist/**/*', fingerprint: true
        }
        
        success {
            echo "Pipeline completed successfully!"
            
            // Update version in interface
            script {
                if (env.BRANCH_NAME == 'main') {
                    sh "echo 'Version: ${VERSION}' > version.txt"
                }
            }
        }
        
        failure {
            echo "Pipeline failed!"
            
            // Send notification
            emailext (
                subject: "Pipeline Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Pipeline failed for ${env.JOB_NAME} build ${env.BUILD_NUMBER}. Check console output for details.",
                recipientProviders: [[$class: 'DevelopersRecipientProvider']]
            )
        }
    }
} 