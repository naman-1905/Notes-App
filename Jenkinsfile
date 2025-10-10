pipeline {
    agent any

    environment {
        REGISTRY        = "10.243.4.236:5000"
        DOCKER_HOST     = "tcp://10.243.250.132:2375"
        APP_NETWORK     = "app"

        // Backend app
        BACKEND_NAME    = "notes-backend"
        BACKEND_IMAGE   = "notes_backend"
        BACKEND_TAG     = "latest"

        // Frontend app
        FRONTEND_NAME   = "notes-frontend"
        FRONTEND_IMAGE  = "notes_frontend"
        FRONTEND_TAG    = "latest"
    }

    stages {

        /* ================================
           Backend Build, Push, Deploy
        ==================================*/
        stage('Build Backend Image') {
            steps {
                dir('backend') {
                    script {
                        echo "Building Backend Docker Image..."
                        sh "docker build -t ${BACKEND_IMAGE}:${BACKEND_TAG} ."
                    }
                }
            }
        }

        stage('Push Backend Image') {
            steps {
                script {
                    echo "Tagging and pushing backend image..."
                    sh """
                        docker tag ${BACKEND_IMAGE}:${BACKEND_TAG} ${REGISTRY}/${BACKEND_IMAGE}:${BACKEND_TAG}
                        docker push ${REGISTRY}/${BACKEND_IMAGE}:${BACKEND_TAG}
                    """
                }
            }
        }

        stage('Deploy Backend') {
            steps {
                script {
                    echo "Deploying ${BACKEND_NAME} to remote Docker host..."

                    // Create network if missing
                    sh """
                        docker -H ${DOCKER_HOST} network inspect ${APP_NETWORK} >/dev/null 2>&1 || \
                        docker -H ${DOCKER_HOST} network create ${APP_NETWORK}
                    """

                    // Stop and remove old container
                    sh """
                        docker -H ${DOCKER_HOST} ps -q --filter name=${BACKEND_NAME} | grep -q . && \
                        docker -H ${DOCKER_HOST} stop ${BACKEND_NAME} || true
                    """
                    sh """
                        docker -H ${DOCKER_HOST} ps -aq --filter name=${BACKEND_NAME} | grep -q . && \
                        docker -H ${DOCKER_HOST} rm ${BACKEND_NAME} || true
                    """

                    // Run new backend container
                    sh """
                        docker -H ${DOCKER_HOST} run -d --name ${BACKEND_NAME} \
                        --network ${APP_NETWORK} \
                        -p 8000:8000 \
                        ${REGISTRY}/${BACKEND_IMAGE}:${BACKEND_TAG}
                    """
                }
            }
        }

        /* ================================
           Frontend Build, Push, Deploy
        ==================================*/
        stage('Build Frontend Image') {
            steps {
                dir('frontend/notes-app') {
                    script {
                        echo "Building Frontend Docker Image..."
                        sh "docker build -t ${FRONTEND_IMAGE}:${FRONTEND_TAG} ."
                    }
                }
            }
        }

        stage('Push Frontend Image') {
            steps {
                script {
                    echo "Tagging and pushing frontend image..."
                    sh """
                        docker tag ${FRONTEND_IMAGE}:${FRONTEND_TAG} ${REGISTRY}/${FRONTEND_IMAGE}:${FRONTEND_TAG}
                        docker push ${REGISTRY}/${FRONTEND_IMAGE}:${FRONTEND_TAG}
                    """
                }
            }
        }

        stage('Deploy Frontend') {
            steps {
                script {
                    echo "Deploying ${FRONTEND_NAME} to remote Docker host..."

                    // Create network if missing
                    sh """
                        docker -H ${DOCKER_HOST} network inspect ${APP_NETWORK} >/dev/null 2>&1 || \
                        docker -H ${DOCKER_HOST} network create ${APP_NETWORK}
                    """

                    // Stop and remove old container
                    sh """
                        docker -H ${DOCKER_HOST} ps -q --filter name=${FRONTEND_NAME} | grep -q . && \
                        docker -H ${DOCKER_HOST} stop ${FRONTEND_NAME} || true
                    """
                    sh """
                        docker -H ${DOCKER_HOST} ps -aq --filter name=${FRONTEND_NAME} | grep -q . && \
                        docker -H ${DOCKER_HOST} rm ${FRONTEND_NAME} || true
                    """

                    // Run new frontend container
                    sh """
                        docker -H ${DOCKER_HOST} run -d --name ${FRONTEND_NAME} \
                        --network ${APP_NETWORK} \
                        -p 3000:3000 \
                        ${REGISTRY}/${FRONTEND_IMAGE}:${FRONTEND_TAG}
                    """
                }
            }
        }

        /* ================================
           Cleanup Local Docker Resources
        ==================================*/
        stage('Cleanup Local Docker Resources') {
            steps {
                script {
                    echo 'Cleaning up unused local Docker images and containers...'
                    sh "docker image prune -f"
                    sh "docker container prune -f"
                }
            }
        }
    }
}
