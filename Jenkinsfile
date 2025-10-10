pipeline {
    agent any

    parameters {
        choice(
            name: 'APP_TO_BUILD',
            choices: ['backend', 'frontend', 'both'],
            description: 'Select which app to build and deploy'
        )
        choice(
            name: 'REGISTRY_OPTION',
            choices: ['Kshitiz Container (10.243.4.236:5000)', 'Naman Container (10.243.250.132:5000)'],
            description: 'Select which registry to push the image to'
        )
        choice(
            name: 'DEPLOY_HOST',
            choices: ['10.243.4.236', '10.243.250.132', 'both'],
            description: 'Select where to deploy the container'
        )
    }

    environment {
        BACKEND_IMAGE = "notes-app-backend"
        FRONTEND_IMAGE = "notes-app-frontend"
        BACKEND_PATH = "backend"
        FRONTEND_PATH = "frontend/notes-app"
        BACKEND_PORT = "5000"
        FRONTEND_PORT = "3000"
    }

    stages {
        stage('Set Registry') {
            steps {
                script {
                    if (params.REGISTRY_OPTION == 'Kshitiz Container (10.243.4.236:5000)') {
                        env.REGISTRY = "10.243.4.236:5000"
                    } else {
                        env.REGISTRY = "registry.halfskirmish.com"
                    }
                }
            }
        }

        stage('Build Backend Docker Image') {
            when {
                expression { params.APP_TO_BUILD == 'backend' || params.APP_TO_BUILD == 'both' }
            }
            steps {
                script {
                    sh """
                        docker build -t ${BACKEND_IMAGE} ${BACKEND_PATH}
                        docker tag ${BACKEND_IMAGE} ${REGISTRY}/${BACKEND_IMAGE}
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
                        sh """
                            docker build \
                                --build-arg NEXT_PUBLIC_BASE_URL=\${BASE_URL} \
                                -t ${FRONTEND_IMAGE} ${FRONTEND_PATH}
                            docker tag ${FRONTEND_IMAGE} ${REGISTRY}/${FRONTEND_IMAGE}
                        """
                    }
                }
            }
        }

        stage('Push Backend Image') {
            when {
                expression { params.APP_TO_BUILD == 'backend' || params.APP_TO_BUILD == 'both' }
            }
            steps {
                sh "docker push ${REGISTRY}/${BACKEND_IMAGE}"
            }
        }

        stage('Push Frontend Image') {
            when {
                expression { params.APP_TO_BUILD == 'frontend' || params.APP_TO_BUILD == 'both' }
            }
            steps {
                sh "docker push ${REGISTRY}/${FRONTEND_IMAGE}"
            }
        }

        stage('Deploy Backend Container') {
            when {
                expression { params.APP_TO_BUILD == 'backend' || params.APP_TO_BUILD == 'both' }
            }
            steps {
                script {
                    def deployHosts = []
                    if (params.DEPLOY_HOST == 'both') {
                        deployHosts = ['10.243.4.236', '10.243.250.132']
                    } else {
                        deployHosts = [params.DEPLOY_HOST]
                    }

                    withCredentials([
                        string(credentialsId: 'ACCESS_TOKEN_SECRET', variable: 'TOKEN_SECRET'),
                        string(credentialsId: 'MONGO_URI', variable: 'MONGO_CONNECTION')
                    ]) {
                        for (host in deployHosts) {
                            sh """
                                docker -H tcp://${host}:2375 pull ${REGISTRY}/${BACKEND_IMAGE}
                                docker -H tcp://${host}:2375 stop ${BACKEND_IMAGE} || true
                                docker -H tcp://${host}:2375 rm ${BACKEND_IMAGE} || true
                                docker -H tcp://${host}:2375 run -d \
                                    --name ${BACKEND_IMAGE} \
                                    --network app \
                                    -p ${BACKEND_PORT}:${BACKEND_PORT} \
                                    -e ACCESS_TOKEN_SECRET=\${TOKEN_SECRET} \
                                    -e PORT=${BACKEND_PORT} \
                                    -e MONGO_URI=\${MONGO_CONNECTION} \
                                    ${REGISTRY}/${BACKEND_IMAGE}
                            """
                        }
                    }
                }
            }
        }

        stage('Deploy Frontend Container') {
            when {
                expression { params.APP_TO_BUILD == 'frontend' || params.APP_TO_BUILD == 'both' }
            }
            steps {
                script {
                    def deployHosts = []
                    if (params.DEPLOY_HOST == 'both') {
                        deployHosts = ['10.243.4.236', '10.243.250.132']
                    } else {
                        deployHosts = [params.DEPLOY_HOST]
                    }

                    withCredentials([string(credentialsId: 'NEXT_PUBLIC_BASE_URL', variable: 'BASE_URL')]) {
                        for (host in deployHosts) {
                            sh """
                                docker -H tcp://${host}:2375 pull ${REGISTRY}/${FRONTEND_IMAGE}
                                docker -H tcp://${host}:2375 stop ${FRONTEND_IMAGE} || true
                                docker -H tcp://${host}:2375 rm ${FRONTEND_IMAGE} || true
                                docker -H tcp://${host}:2375 run -d \
                                    --name ${FRONTEND_IMAGE} \
                                    --network app \
                                    -p ${FRONTEND_PORT}:${FRONTEND_PORT} \
                                    -e NEXT_PUBLIC_BASE_URL=\${BASE_URL} \
                                    ${REGISTRY}/${FRONTEND_IMAGE}
                            """
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Deployment completed successfully!"
        }
        failure {
            echo "Deployment failed. Please check the logs."
        }
        always {
            sh "docker system prune -f || true"
        }
    }
}