pipeline {
    agent any

    environment {
        // Registry configuration
        REGISTRY        = "10.243.4.236:5000"
        TAG             = "latest"

        // Docker deployment configuration
        DOCKER_HOST     = "tcp://10.243.52.185:2375"
        APP_NETWORK     = "app"

        // Image and container names
        FRONTEND_IMAGE_NAME      = "halfskirmish-notes-frontend"
        BACKEND_IMAGE_NAME       = "halfskirmish-notes-backend"
        FRONTEND_CONTAINER_NAME  = "halfskirmish-notes-frontend"
        BACKEND_CONTAINER_NAME   = "halfskirmish-notes-backend"
    }

    stages {
        stage('Build Frontend Docker Image') {
            steps {
                dir('frontend/notes-app') {
                    script {
                        echo 'Building Frontend Docker Image...'
                        sh 'npm ci --force'
                        sh "docker build -t ${FRONTEND_IMAGE_NAME}:${TAG} ."
                    }
                }
            }
        }

        stage('Build Backend Docker Image') {
            steps {
                dir('backend') {
                    script {
                        echo 'Building Backend Docker Image...'
                        sh "docker build -t ${BACKEND_IMAGE_NAME}:${TAG} ."
                    }
                }
            }
        }

        stage('Tag Images for Registry') {
            steps {
                script {
                    echo 'Tagging images for remote registry...'
                    sh "docker tag ${FRONTEND_IMAGE_NAME}:${TAG} ${REGISTRY}/${FRONTEND_IMAGE_NAME}:${TAG}"
                    sh "docker tag ${BACKEND_IMAGE_NAME}:${TAG} ${REGISTRY}/${BACKEND_IMAGE_NAME}:${TAG}"
                }
            }
        }

        stage('Push Images to Registry') {
            steps {
                script {
                    echo 'Pushing Docker Images to Registry...'
                    sh "docker push ${REGISTRY}/${FRONTEND_IMAGE_NAME}:${TAG}"
                    sh "docker push ${REGISTRY}/${BACKEND_IMAGE_NAME}:${TAG}"
                }
            }
        }

        stage('Deploy to Remote Docker') {
            steps {
                script {
                    echo "Deploying Notes App services on remote Docker host..."

                    // Create app network if not exists
                    sh """
                        docker -H ${DOCKER_HOST} network inspect ${APP_NETWORK} >/dev/null 2>&1 || \
                        docker -H ${DOCKER_HOST} network create ${APP_NETWORK}
                    """

                    // Deploy Frontend
                    echo "Deploying Frontend..."
                    sh """
                        docker -H ${DOCKER_HOST} ps -q --filter name=${FRONTEND_CONTAINER_NAME} | grep -q . && \
                        docker -H ${DOCKER_HOST} stop ${FRONTEND_CONTAINER_NAME} || true
                    """
                    sh """
                        docker -H ${DOCKER_HOST} ps -aq --filter name=${FRONTEND_CONTAINER_NAME} | grep -q . && \
                        docker -H ${DOCKER_HOST} rm ${FRONTEND_CONTAINER_NAME} || true
                    """
                    sh """
                        docker -H ${DOCKER_HOST} run -d --name ${FRONTEND_CONTAINER_NAME} \\
                        --network ${APP_NETWORK} \\
                        ${REGISTRY}/${FRONTEND_IMAGE_NAME}:${TAG}
                    """

                    // Deploy Backend
                    echo "Deploying Backend..."
                    sh """
                        docker -H ${DOCKER_HOST} ps -q --filter name=${BACKEND_CONTAINER_NAME} | grep -q . && \
                        docker -H ${DOCKER_HOST} stop ${BACKEND_CONTAINER_NAME} || true
                    """
                    sh """
                        docker -H ${DOCKER_HOST} ps -aq --filter name=${BACKEND_CONTAINER_NAME} | grep -q . && \
                        docker -H ${DOCKER_HOST} rm ${BACKEND_CONTAINER_NAME} || true
                    """
                    sh """
                        docker -H ${DOCKER_HOST} run -d --name ${BACKEND_CONTAINER_NAME} \\
                        --network ${APP_NETWORK} \\
                        ${REGISTRY}/${BACKEND_IMAGE_NAME}:${TAG}
                    """
                }
            }
        }

        stage('Cleanup Local') {
            steps {
                script {
                    echo 'Cleaning up unused local Docker resources...'
                    sh "docker image prune -f"
                    sh "docker container prune -f"
                    
                    echo 'Cleaning up build artifacts...'
                    sh "rm -rf frontend/notes-app/.next || true"
                    sh "rm -rf frontend/notes-app/out || true"
                    sh "rm -rf frontend/notes-app/node_modules/.cache || true"
                    sh "rm -rf backend/node_modules/.cache || true"
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
            echo 'Both Frontend and Backend services deployed to Docker network: app'
            echo "Frontend container: ${FRONTEND_CONTAINER_NAME}"
            echo "Backend container: ${BACKEND_CONTAINER_NAME}"
        }
        failure {
            echo 'Pipeline failed!'
        }
        always {
            echo 'Cleaning up workspace...'
        }
    }
}
