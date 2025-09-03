pipeline {
    agent any

    environment {
        REGISTRY        = "10.243.4.236:5000"
        TAG             = "latest"
        DOCKER_HOST     = "tcp://10.243.52.185:2375"
        APP_NETWORK     = "app"

        FRONTEND_IMAGE      = "halfskirmish_notes_frontend"
        BACKEND_IMAGE       = "halfskirmish_notes_backend"
        
        FRONTEND_DEPLOYMENT = "halfskirmish-notes-frontend"
        BACKEND_DEPLOYMENT  = "halfskirmish-notes-backend"

        FRONTEND_BUILD_CONTEXT = "frontend/notes-app"
        BACKEND_BUILD_CONTEXT  = "backend"
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    echo 'Building frontend image...'
                    sh """
                        docker build -t ${FRONTEND_IMAGE}:${TAG} \\
                        --build-arg NEXT_PUBLIC_BASE_URL=https://apinotes.halfskirmish.com \\
                        -f ${FRONTEND_BUILD_CONTEXT}/Dockerfile ${FRONTEND_BUILD_CONTEXT}
                    """
                    echo 'Building backend image...'
                    sh """
                        docker build -t ${BACKEND_IMAGE}:${TAG} -f ${BACKEND_BUILD_CONTEXT}/Dockerfile ${BACKEND_BUILD_CONTEXT}
                    """
                }
            }
        }

        stage('Push Images to Registry') {
            steps {
                script {
                    echo 'Tagging and pushing frontend image...'
                    sh """
                        docker tag ${FRONTEND_IMAGE}:${TAG} ${REGISTRY}/${FRONTEND_IMAGE}:${TAG}
                        docker push ${REGISTRY}/${FRONTEND_IMAGE}:${TAG}
                    """
                    echo 'Tagging and pushing backend image...'
                    sh """
                        docker tag ${BACKEND_IMAGE}:${TAG} ${REGISTRY}/${BACKEND_IMAGE}:${TAG}
                        docker push ${REGISTRY}/${BACKEND_IMAGE}:${TAG}
                    """
                }
            }
        }

        stage('Deploy to Remote Docker') {
            steps {
                script {
                    echo 'Ensuring app network exists...'
                    sh """
                        docker -H ${DOCKER_HOST} network inspect ${APP_NETWORK} >/dev/null 2>&1 || \\
                        docker -H ${DOCKER_HOST} network create ${APP_NETWORK}
                    """

                    // Backend deployment
                    withCredentials([string(credentialsId: 'BACKEND_CONFIG_JSON', variable: 'BACKEND_CONFIG_JSON')]) {
                        sh '''
                            printf "%s" "$BACKEND_CONFIG_JSON" > backend-config.json
                            # Remove old container if exists
                            docker -H ${DOCKER_HOST} rm -f ${BACKEND_DEPLOYMENT} || true
                            # Create and start new backend container with config
                            BACKEND_CID=$(docker -H ${DOCKER_HOST} create --name ${BACKEND_DEPLOYMENT} --network ${APP_NETWORK} -p 5000:5000 ${REGISTRY}/${BACKEND_IMAGE}:${TAG})
                            docker -H ${DOCKER_HOST} cp backend-config.json ${BACKEND_CID}:/app/config.json
                            docker -H ${DOCKER_HOST} start ${BACKEND_CID}
                            rm backend-config.json
                        '''
                    }

                    // Frontend deployment
                    sh """
                        docker -H ${DOCKER_HOST} rm -f ${FRONTEND_DEPLOYMENT} || true
                        docker -H ${DOCKER_HOST} run -d --name ${FRONTEND_DEPLOYMENT} \\
                            --network ${APP_NETWORK} \\
                            -p 3000:3000 \\
                            ${REGISTRY}/${FRONTEND_IMAGE}:${TAG}
                    """
                }
            }
        }

        stage('Cleanup Local Docker') {
            steps {
                echo 'Pruning local Docker images and containers...'
                sh "docker image prune -f"
                sh "docker container prune -f"
            }
        }
    }

    post {
        success {
            echo "Deployment finished successfully."
            echo "Frontend: ${FRONTEND_DEPLOYMENT}, Backend: ${BACKEND_DEPLOYMENT}"
        }
        failure {
            echo "Deployment failed - check logs."
        }
    }
}
