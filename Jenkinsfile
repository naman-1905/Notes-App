pipeline {
    agent any

    parameters {
        choice(
            name: 'BUILD_TARGET',
            choices: ['frontend', 'backend', 'both'],
            description: 'Select what to build and deploy'
        )
    }

    environment {
        // Common settings
        REGISTRY        = "10.243.4.236:5000"
        DOCKER_HOST     = "tcp://10.243.250.132:2375"
        APP_NETWORK     = "app"
        TAG             = "latest"
        
        // Frontend settings
        FRONTEND_IMAGE_NAME      = "notes-app-frontend"
        FRONTEND_DEPLOYMENT_NAME = "notes-frontend"
        FRONTEND_CONTEXT         = "frontend/notes-app"
        
        // Backend settings
        BACKEND_IMAGE_NAME      = "notes-app-backend"
        BACKEND_DEPLOYMENT_NAME = "notes-backend"
        BACKEND_CONTEXT         = "backend"
    }

    stages {
        stage('Check Registry Connection') {
            steps {
                script {
                    echo 'Checking registry connectivity...'
                    sh """
                        curl -f http://${REGISTRY}/v2/_catalog || \
                        (echo "ERROR: Cannot connect to registry at ${REGISTRY}" && exit 1)
                    """
                }
            }
        }

        stage('Build Frontend Docker Image') {
            when {
                expression { params.BUILD_TARGET == 'frontend' || params.BUILD_TARGET == 'both' }
            }
            steps {
                script {
                    echo 'Building Frontend Docker Image...'
                    withCredentials([string(credentialsId: 'NEXT_PUBLIC_BASE_URL', variable: 'NEXT_PUBLIC_BASE_URL')]) {
                        sh """
                            docker build \
                            --build-arg NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL} \
                            -t ${FRONTEND_IMAGE_NAME}:${TAG} \
                            -f ${FRONTEND_CONTEXT}/Dockerfile \
                            ${FRONTEND_CONTEXT}
                        """
                    }
                }
            }
        }

        stage('Build Backend Docker Image') {
            when {
                expression { params.BUILD_TARGET == 'backend' || params.BUILD_TARGET == 'both' }
            }
            steps {
                script {
                    echo 'Building Backend Docker Image...'
                    sh """
                        docker build \
                        -t ${BACKEND_IMAGE_NAME}:${TAG} \
                        -f ${BACKEND_CONTEXT}/Dockerfile \
                        ${BACKEND_CONTEXT}
                    """
                }
            }
        }

        stage('Tag Frontend Image for Registry') {
            when {
                expression { params.BUILD_TARGET == 'frontend' || params.BUILD_TARGET == 'both' }
            }
            steps {
                script {
                    echo 'Tagging frontend image for remote registry...'
                    sh "docker tag ${FRONTEND_IMAGE_NAME}:${TAG} ${REGISTRY}/${FRONTEND_IMAGE_NAME}:${TAG}"
                }
            }
        }

        stage('Tag Backend Image for Registry') {
            when {
                expression { params.BUILD_TARGET == 'backend' || params.BUILD_TARGET == 'both' }
            }
            steps {
                script {
                    echo 'Tagging backend image for remote registry...'
                    sh "docker tag ${BACKEND_IMAGE_NAME}:${TAG} ${REGISTRY}/${BACKEND_IMAGE_NAME}:${TAG}"
                }
            }
        }

        stage('Push Frontend Image to Registry') {
            when {
                expression { params.BUILD_TARGET == 'frontend' || params.BUILD_TARGET == 'both' }
            }
            steps {
                script {
                    echo 'Pushing Frontend Docker Image to Registry...'
                    sh "docker push ${REGISTRY}/${FRONTEND_IMAGE_NAME}:${TAG}"
                }
            }
        }

        stage('Push Backend Image to Registry') {
            when {
                expression { params.BUILD_TARGET == 'backend' || params.BUILD_TARGET == 'both' }
            }
            steps {
                script {
                    echo 'Pushing Backend Docker Image to Registry...'
                    sh "docker push ${REGISTRY}/${BACKEND_IMAGE_NAME}:${TAG}"
                }
            }
        }

        stage('Deploy Frontend to Remote Docker') {
            when {
                expression { params.BUILD_TARGET == 'frontend' || params.BUILD_TARGET == 'both' }
            }
            steps {
                script {
                    echo "Deploying ${FRONTEND_DEPLOYMENT_NAME} on remote Docker host..."

                    // Create app network if not exists
                    sh """
                        docker -H ${DOCKER_HOST} network inspect ${APP_NETWORK} >/dev/null 2>&1 || \
                        docker -H ${DOCKER_HOST} network create ${APP_NETWORK}
                    """

                    // Stop and remove old container if running
                    sh """
                        docker -H ${DOCKER_HOST} ps -q --filter name=${FRONTEND_DEPLOYMENT_NAME} | grep -q . && \
                        docker -H ${DOCKER_HOST} stop ${FRONTEND_DEPLOYMENT_NAME} || true
                    """
                    sh """
                        docker -H ${DOCKER_HOST} ps -aq --filter name=${FRONTEND_DEPLOYMENT_NAME} | grep -q . && \
                        docker -H ${DOCKER_HOST} rm ${FRONTEND_DEPLOYMENT_NAME} || true
                    """

                    // Run new container
                    withCredentials([string(credentialsId: 'NEXT_PUBLIC_BASE_URL', variable: 'NEXT_PUBLIC_BASE_URL')]) {
                        sh """
                            docker -H ${DOCKER_HOST} run -d --name ${FRONTEND_DEPLOYMENT_NAME} \\
                            --network ${APP_NETWORK} \\
                            -e NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL} \\
                            ${REGISTRY}/${FRONTEND_IMAGE_NAME}:${TAG}
                        """
                    }
                }
            }
        }

        stage('Deploy Backend to Remote Docker') {
            when {
                expression { params.BUILD_TARGET == 'backend' || params.BUILD_TARGET == 'both' }
            }
            steps {
                script {
                    echo "Deploying ${BACKEND_DEPLOYMENT_NAME} on remote Docker host..."

                    // Create app network if not exists
                    sh """
                        docker -H ${DOCKER_HOST} network inspect ${APP_NETWORK} >/dev/null 2>&1 || \
                        docker -H ${DOCKER_HOST} network create ${APP_NETWORK}
                    """

                    // Stop and remove old container if running
                    sh """
                        docker -H ${DOCKER_HOST} ps -q --filter name=${BACKEND_DEPLOYMENT_NAME} | grep -q . && \
                        docker -H ${DOCKER_HOST} stop ${BACKEND_DEPLOYMENT_NAME} || true
                    """
                    sh """
                        docker -H ${DOCKER_HOST} ps -aq --filter name=${BACKEND_DEPLOYMENT_NAME} | grep -q . && \
                        docker -H ${DOCKER_HOST} rm ${BACKEND_DEPLOYMENT_NAME} || true
                    """

                    // Run new container with secrets
                    withCredentials([
                        string(credentialsId: 'ACCESS_TOKEN_SECRET', variable: 'ACCESS_TOKEN_SECRET'),
                        string(credentialsId: 'MONGO_URI', variable: 'MONGO_URI')
                    ]) {
                        sh """
                            docker -H ${DOCKER_HOST} run -d --name ${BACKEND_DEPLOYMENT_NAME} \\
                            --network ${APP_NETWORK} \\
                            -e ACCESS_TOKEN_SECRET=${ACCESS_TOKEN_SECRET} \\
                            -e MONGO_URI=${MONGO_URI} \\
                            -e PORT=8000 \\
                            ${REGISTRY}/${BACKEND_IMAGE_NAME}:${TAG}
                        """
                    }
                }
            }
        }

        stage('Cleanup Local') {
            steps {
                script {
                    echo 'Cleaning up unused local Docker resources...'
                    sh "docker image prune -f"
                    sh "docker container prune -f"
                }
            }
        }
    }

    post {
        success {
            echo "Deployment successful for: ${params.BUILD_TARGET}"
        }
        failure {
            echo "Deployment failed for: ${params.BUILD_TARGET}"
        }
    }
}