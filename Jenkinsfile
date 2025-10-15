pipeline {
    agent any

    parameters {
        choice(
            name: 'APP_TO_BUILD',
            choices: ['backend', 'frontend', 'both'],
            description: 'Select which app to build and deploy'
        )
        choice(
            name: 'DEPLOY_TARGET',
            choices: ['both', 'kahitoz', 'naman'],
            description: 'Select where to deploy the container'
        )
    }

    environment {
        BACKEND_IMAGE_NAME = 'notes-app-backend'
        FRONTEND_IMAGE_NAME = 'notes-app-frontend'
        IMAGE_TAG = 'latest'
        BUILD_REGISTRY = 'registrypush.kahitoz.com:5000'
        DEPLOY_REGISTRY = 'registry.kahitoz.com'

        KAHITOZ_DOCKER_HOST = 'tcp://kahitozrunner:2375'
        NAMAN_DOCKER_HOST = 'tcp://naman:2375'

        BACKEND_CONTAINER_NAME = 'notes-app-backend'
        FRONTEND_CONTAINER_NAME = 'notes-app-frontend'
        NETWORK_NAME = 'app'

        BACKEND_PATH = 'backend'
        FRONTEND_PATH = 'frontend/notes-app'
    }

    stages {

        stage('Build Backend Docker Image') {
            when {
                expression { params.APP_TO_BUILD == 'backend' || params.APP_TO_BUILD == 'both' }
            }
            steps {
                script {
                    echo "Building Backend Docker image: ${BACKEND_IMAGE_NAME}:${IMAGE_TAG}"
                    sh """
                        docker build -t ${BUILD_REGISTRY}/${BACKEND_IMAGE_NAME}:${IMAGE_TAG} ${BACKEND_PATH}
                    """
                }
            }
        }

        stage('Build Frontend Docker Image') {
            when {
                expression { params.APP_TO_BUILD == 'frontend' || params.APP_TO_BUILD == 'both' }
            }
            steps {
                script {
                    withCredentials([string(credentialsId: 'NEXT_PUBLIC_BASE_URL', variable: 'BASE_URL')]) {
                        echo "Building Frontend Docker image: ${FRONTEND_IMAGE_NAME}:${IMAGE_TAG}"
                        sh """
                            docker build \
                                --build-arg NEXT_PUBLIC_BASE_URL=\${BASE_URL} \
                                -t ${BUILD_REGISTRY}/${FRONTEND_IMAGE_NAME}:${IMAGE_TAG} ${FRONTEND_PATH}
                        """
                    }
                }
            }
        }

        stage('Push Docker Images') {
            steps {
                script {
                    echo "Logging into Docker registries..."
                    withCredentials([usernamePassword(credentialsId: 'docker_creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh '''
                            echo "$DOCKER_PASS" | docker login ''' + BUILD_REGISTRY + ''' -u "$DOCKER_USER" --password-stdin
                            echo "$DOCKER_PASS" | docker login ''' + DEPLOY_REGISTRY + ''' -u "$DOCKER_USER" --password-stdin
                        '''
                    }

                    if (params.APP_TO_BUILD == 'backend' || params.APP_TO_BUILD == 'both') {
                        echo "Pushing Backend image to ${BUILD_REGISTRY}..."
                        sh """
                            docker push ${BUILD_REGISTRY}/${BACKEND_IMAGE_NAME}:${IMAGE_TAG}
                        """

                        echo "Re-tagging and pushing Backend to ${DEPLOY_REGISTRY}..."
                        sh """
                            docker tag ${BUILD_REGISTRY}/${BACKEND_IMAGE_NAME}:${IMAGE_TAG} ${DEPLOY_REGISTRY}/${BACKEND_IMAGE_NAME}:${IMAGE_TAG}
                            docker push ${DEPLOY_REGISTRY}/${BACKEND_IMAGE_NAME}:${IMAGE_TAG}
                        """
                    }

                    if (params.APP_TO_BUILD == 'frontend' || params.APP_TO_BUILD == 'both') {
                        echo "Pushing Frontend image to ${BUILD_REGISTRY}..."
                        sh """
                            docker push ${BUILD_REGISTRY}/${FRONTEND_IMAGE_NAME}:${IMAGE_TAG}
                        """

                        echo "Re-tagging and pushing Frontend to ${DEPLOY_REGISTRY}..."
                        sh """
                            docker tag ${BUILD_REGISTRY}/${FRONTEND_IMAGE_NAME}:${IMAGE_TAG} ${DEPLOY_REGISTRY}/${FRONTEND_IMAGE_NAME}:${IMAGE_TAG}
                            docker push ${DEPLOY_REGISTRY}/${FRONTEND_IMAGE_NAME}:${IMAGE_TAG}
                        """
                    }

                    echo "Logout from registries"
                    sh """
                        docker logout ${BUILD_REGISTRY} || true
                        docker logout ${DEPLOY_REGISTRY} || true
                    """
                }
            }
        }

        stage('Deploy to Docker Hosts') {
            parallel {

                stage('Deploy Backend to Kahitoz') {
                    when {
                        allOf {
                            anyOf {
                                expression { params.DEPLOY_TARGET == 'both' }
                                expression { params.DEPLOY_TARGET == 'kahitoz' }
                            }
                            anyOf {
                                expression { params.APP_TO_BUILD == 'backend' }
                                expression { params.APP_TO_BUILD == 'both' }
                            }
                        }
                    }
                    steps {
                        script {
                            echo "Deploying Backend to Kahitoz Docker host..."
                            withCredentials([
                                usernamePassword(credentialsId: 'docker_creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS'),
                                string(credentialsId: 'ACCESS_TOKEN_SECRET', variable: 'TOKEN_SECRET'),
                                string(credentialsId: 'MONGO_URI', variable: 'MONGO_CONNECTION')
                            ]) {
                                sh '''
                                    echo "$DOCKER_PASS" | DOCKER_HOST=''' + KAHITOZ_DOCKER_HOST + ''' docker login ''' + DEPLOY_REGISTRY + ''' -u "$DOCKER_USER" --password-stdin
                                    DOCKER_HOST=''' + KAHITOZ_DOCKER_HOST + ''' docker stop ''' + BACKEND_CONTAINER_NAME + ''' || true
                                    DOCKER_HOST=''' + KAHITOZ_DOCKER_HOST + ''' docker rm ''' + BACKEND_CONTAINER_NAME + ''' || true
                                    DOCKER_HOST=''' + KAHITOZ_DOCKER_HOST + ''' docker pull ''' + DEPLOY_REGISTRY + '''/''' + BACKEND_IMAGE_NAME + ''':''' + IMAGE_TAG + '''
                                    DOCKER_HOST=''' + KAHITOZ_DOCKER_HOST + ''' docker run -d \
                                        --name ''' + BACKEND_CONTAINER_NAME + ''' \
                                        --network ''' + NETWORK_NAME + ''' \
                                        --restart always \
                                        -e ACCESS_TOKEN_SECRET="$TOKEN_SECRET" \
                                        -e PORT=5000 \
                                        -e MONGO_URI="$MONGO_CONNECTION" \
                                        ''' + DEPLOY_REGISTRY + '''/''' + BACKEND_IMAGE_NAME + ''':''' + IMAGE_TAG + '''
                                    DOCKER_HOST=''' + KAHITOZ_DOCKER_HOST + ''' docker logout ''' + DEPLOY_REGISTRY + ''' || true
                                '''
                            }
                        }
                    }
                }

                stage('Deploy Backend to Naman') {
                    when {
                        allOf {
                            anyOf {
                                expression { params.DEPLOY_TARGET == 'both' }
                                expression { params.DEPLOY_TARGET == 'naman' }
                            }
                            anyOf {
                                expression { params.APP_TO_BUILD == 'backend' }
                                expression { params.APP_TO_BUILD == 'both' }
                            }
                        }
                    }
                    steps {
                        script {
                            echo "Deploying Backend to Naman Docker host..."
                            withCredentials([
                                usernamePassword(credentialsId: 'docker_creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS'),
                                string(credentialsId: 'ACCESS_TOKEN_SECRET', variable: 'TOKEN_SECRET'),
                                string(credentialsId: 'MONGO_URI', variable: 'MONGO_CONNECTION')
                            ]) {
                                sh '''
                                    echo "$DOCKER_PASS" | DOCKER_HOST=''' + NAMAN_DOCKER_HOST + ''' docker login ''' + DEPLOY_REGISTRY + ''' -u "$DOCKER_USER" --password-stdin
                                    DOCKER_HOST=''' + NAMAN_DOCKER_HOST + ''' docker stop ''' + BACKEND_CONTAINER_NAME + ''' || true
                                    DOCKER_HOST=''' + NAMAN_DOCKER_HOST + ''' docker rm ''' + BACKEND_CONTAINER_NAME + ''' || true
                                    DOCKER_HOST=''' + NAMAN_DOCKER_HOST + ''' docker pull ''' + DEPLOY_REGISTRY + '''/''' + BACKEND_IMAGE_NAME + ''':''' + IMAGE_TAG + '''
                                    DOCKER_HOST=''' + NAMAN_DOCKER_HOST + ''' docker run -d \
                                        --name ''' + BACKEND_CONTAINER_NAME + ''' \
                                        --network ''' + NETWORK_NAME + ''' \
                                        --restart always \
                                        -e ACCESS_TOKEN_SECRET="$TOKEN_SECRET" \
                                        -e PORT=5000 \
                                        -e MONGO_URI="$MONGO_CONNECTION" \
                                        ''' + DEPLOY_REGISTRY + '''/''' + BACKEND_IMAGE_NAME + ''':''' + IMAGE_TAG + '''
                                    DOCKER_HOST=''' + NAMAN_DOCKER_HOST + ''' docker logout ''' + DEPLOY_REGISTRY + ''' || true
                                '''
                            }
                        }
                    }
                }

                stage('Deploy Frontend to Kahitoz') {
                    when {
                        allOf {
                            anyOf {
                                expression { params.DEPLOY_TARGET == 'both' }
                                expression { params.DEPLOY_TARGET == 'kahitoz' }
                            }
                            anyOf {
                                expression { params.APP_TO_BUILD == 'frontend' }
                                expression { params.APP_TO_BUILD == 'both' }
                            }
                        }
                    }
                    steps {
                        script {
                            echo "Deploying Frontend to Kahitoz Docker host..."
                            withCredentials([
                                usernamePassword(credentialsId: 'docker_creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS'),
                                string(credentialsId: 'NEXT_PUBLIC_BASE_URL', variable: 'BASE_URL')
                            ]) {
                                sh '''
                                    echo "$DOCKER_PASS" | DOCKER_HOST=''' + KAHITOZ_DOCKER_HOST + ''' docker login ''' + DEPLOY_REGISTRY + ''' -u "$DOCKER_USER" --password-stdin
                                    DOCKER_HOST=''' + KAHITOZ_DOCKER_HOST + ''' docker stop ''' + FRONTEND_CONTAINER_NAME + ''' || true
                                    DOCKER_HOST=''' + KAHITOZ_DOCKER_HOST + ''' docker rm ''' + FRONTEND_CONTAINER_NAME + ''' || true
                                    DOCKER_HOST=''' + KAHITOZ_DOCKER_HOST + ''' docker pull ''' + DEPLOY_REGISTRY + '''/''' + FRONTEND_IMAGE_NAME + ''':''' + IMAGE_TAG + '''
                                    DOCKER_HOST=''' + KAHITOZ_DOCKER_HOST + ''' docker run -d \
                                        --name ''' + FRONTEND_CONTAINER_NAME + ''' \
                                        --network ''' + NETWORK_NAME + ''' \
                                        --restart always \
                                        -e NEXT_PUBLIC_BASE_URL="$BASE_URL" \
                                        ''' + DEPLOY_REGISTRY + '''/''' + FRONTEND_IMAGE_NAME + ''':''' + IMAGE_TAG + '''
                                    DOCKER_HOST=''' + KAHITOZ_DOCKER_HOST + ''' docker logout ''' + DEPLOY_REGISTRY + ''' || true
                                '''
                            }
                        }
                    }
                }

                stage('Deploy Frontend to Naman') {
                    when {
                        allOf {
                            anyOf {
                                expression { params.DEPLOY_TARGET == 'both' }
                                expression { params.DEPLOY_TARGET == 'naman' }
                            }
                            anyOf {
                                expression { params.APP_TO_BUILD == 'frontend' }
                                expression { params.APP_TO_BUILD == 'both' }
                            }
                        }
                    }
                    steps {
                        script {
                            echo "Deploying Frontend to Naman Docker host..."
                            withCredentials([
                                usernamePassword(credentialsId: 'docker_creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS'),
                                string(credentialsId: 'NEXT_PUBLIC_BASE_URL', variable: 'BASE_URL')
                            ]) {
                                sh '''
                                    echo "$DOCKER_PASS" | DOCKER_HOST=''' + NAMAN_DOCKER_HOST + ''' docker login ''' + DEPLOY_REGISTRY + ''' -u "$DOCKER_USER" --password-stdin
                                    DOCKER_HOST=''' + NAMAN_DOCKER_HOST + ''' docker stop ''' + FRONTEND_CONTAINER_NAME + ''' || true
                                    DOCKER_HOST=''' + NAMAN_DOCKER_HOST + ''' docker rm ''' + FRONTEND_CONTAINER_NAME + ''' || true
                                    DOCKER_HOST=''' + NAMAN_DOCKER_HOST + ''' docker pull ''' + DEPLOY_REGISTRY + '''/''' + FRONTEND_IMAGE_NAME + ''':''' + IMAGE_TAG + '''
                                    DOCKER_HOST=''' + NAMAN_DOCKER_HOST + ''' docker run -d \
                                        --name ''' + FRONTEND_CONTAINER_NAME + ''' \
                                        --network ''' + NETWORK_NAME + ''' \
                                        --restart always \
                                        -e NEXT_PUBLIC_BASE_URL="$BASE_URL" \
                                        ''' + DEPLOY_REGISTRY + '''/''' + FRONTEND_IMAGE_NAME + ''':''' + IMAGE_TAG + '''
                                    DOCKER_HOST=''' + NAMAN_DOCKER_HOST + ''' docker logout ''' + DEPLOY_REGISTRY + ''' || true
                                '''
                            }
                        }
                    }
                }
            }
        }
    }

    post {
        cleanup {
            script {
                echo "Cleaning up local Docker images..."
                sh """
                    docker rmi ${BUILD_REGISTRY}/${BACKEND_IMAGE_NAME}:${IMAGE_TAG} || true
                    docker rmi ${DEPLOY_REGISTRY}/${BACKEND_IMAGE_NAME}:${IMAGE_TAG} || true
                    docker rmi ${BUILD_REGISTRY}/${FRONTEND_IMAGE_NAME}:${IMAGE_TAG} || true
                    docker rmi ${DEPLOY_REGISTRY}/${FRONTEND_IMAGE_NAME}:${IMAGE_TAG} || true
                    docker system prune -f || true
                """
            }
        }
    }
}