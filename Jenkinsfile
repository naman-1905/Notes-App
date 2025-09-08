pipeline {
    agent any

    parameters {
        choice(
            name: 'SERVICE_TO_BUILD',
            choices: ['frontend', 'backend', 'both'],
            description: 'Choose which service to build and deploy'
        )
        choice(
            name: 'DEPLOY_TARGET',
            choices: ['docker', 'build-only'],
            description: 'Choose where to deploy or just build the image'
        )
    }

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
        stage('Build Frontend') {
            when {
                expression { params.SERVICE_TO_BUILD == 'frontend' || params.SERVICE_TO_BUILD == 'both' }
            }
            steps {
                dir('frontend/notes-app') {
                    echo 'Building Frontend Docker Image...'
                    sh 'npm ci --force'
                    sh """
                        docker build -t ${REGISTRY}/${FRONTEND_IMAGE_NAME}:${TAG} .
                    """
                }
            }
        }

        stage('Build Backend') {
            when {
                expression { params.SERVICE_TO_BUILD == 'backend' || params.SERVICE_TO_BUILD == 'both' }
            }
            steps {
                dir('backend') {
                    echo 'Building Backend Docker Image...'
                    sh """
                        docker build -t ${REGISTRY}/${BACKEND_IMAGE_NAME}:${TAG} .
                    """
                }
            }
        }

        stage('Push Frontend Image') {
            when {
                expression { 
                    (params.SERVICE_TO_BUILD == 'frontend' || params.SERVICE_TO_BUILD == 'both') && 
                    params.DEPLOY_TARGET != 'build-only' 
                }
            }
            steps {
                echo 'Pushing Frontend Docker Image to Registry...'
                sh "docker push ${REGISTRY}/${FRONTEND_IMAGE_NAME}:${TAG}"
            }
        }

        stage('Push Backend Image') {
            when {
                expression { 
                    (params.SERVICE_TO_BUILD == 'backend' || params.SERVICE_TO_BUILD == 'both') && 
                    params.DEPLOY_TARGET != 'build-only' 
                }
            }
            steps {
                echo 'Pushing Backend Docker Image to Registry...'
                sh "docker push ${REGISTRY}/${BACKEND_IMAGE_NAME}:${TAG}"
            }
        }

        stage('Deploy Frontend') {
            when {
                expression { 
                    (params.SERVICE_TO_BUILD == 'frontend' || params.SERVICE_TO_BUILD == 'both') && 
                    params.DEPLOY_TARGET == 'docker' 
                }
            }
            steps {
                script {
                    echo "Deploying Frontend to Remote Docker..."
                    sh """
                        docker -H ${DOCKER_HOST} network inspect ${APP_NETWORK} >/dev/null 2>&1 || \
                        docker -H ${DOCKER_HOST} network create ${APP_NETWORK}
                    """
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
                        -p 3000:3000 \\
                        ${REGISTRY}/${FRONTEND_IMAGE_NAME}:${TAG}
                    """
                }
            }
        }

        stage('Deploy Backend') {
            when {
                expression { 
                    (params.SERVICE_TO_BUILD == 'backend' || params.SERVICE_TO_BUILD == 'both') && 
                    params.DEPLOY_TARGET == 'docker' 
                }
            }
            steps {
                script {
                    echo "Deploying Backend to Remote Docker..."
                    sh """
                        docker -H ${DOCKER_HOST} network inspect ${APP_NETWORK} >/dev/null 2>&1 || \
                        docker -H ${DOCKER_HOST} network create ${APP_NETWORK}
                    """
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
                        -p 5000:5000 \\
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
                    if (params.SERVICE_TO_BUILD == 'frontend' || params.SERVICE_TO_BUILD == 'both') {
                        sh "rm -rf frontend/notes-app/.next || true"
                        sh "rm -rf frontend/notes-app/out || true"
                        sh "rm -rf frontend/notes-app/node_modules/.cache || true"
                    }
                    if (params.SERVICE_TO_BUILD == 'backend' || params.SERVICE_TO_BUILD == 'both') {
                        sh "rm -rf backend/node_modules/.cache || true"
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
            script {
                if (params.DEPLOY_TARGET == 'docker') {
                    echo 'Services deployed to Docker network: app'
                    if (params.SERVICE_TO_BUILD == 'frontend' || params.SERVICE_TO_BUILD == 'both') {
                        echo "Frontend container: ${FRONTEND_CONTAINER_NAME}"
                    }
                    if (params.SERVICE_TO_BUILD == 'backend' || params.SERVICE_TO_BUILD == 'both') {
                        echo "Backend container: ${BACKEND_CONTAINER_NAME}"
                    }
                } else {
                    echo 'Images built and available locally'
                }
            }
        }
        failure {
            echo 'Pipeline failed!'
        }
        always {
            echo 'Cleaning up workspace...'
        }
    }
}
