pipeline {
    agent any

    parameters {
        choice(
            name: 'APP_TO_BUILD',
            choices: ['frontend', 'backend', 'both'],
            description: 'Select which app to build and deploy'
        )
        choice(
            name: 'REGISTRY_OPTION',
            choices: ['Kshitiz Container (10.243.4.236:5000)', 'Naman Container (registry.halfskirmish.com)'],
            description: 'Select which registry to push the image to'
        )
        choice(
            name: 'DEPLOY_HOST',
            choices: ['10.243.4.236', '10.243.250.132', 'both'],
            description: 'Select where to deploy the container'
        )
    }

    environment {
        FRONTEND_IMAGE = "notes_frontend"
        BACKEND_IMAGE = "notes_backend"
        FRONTEND_PATH = "frontend/notes-app"
        BACKEND_PATH = "backend"
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

        stage('Build Frontend') {
            when {
                expression { params.APP_TO_BUILD == 'frontend' || params.APP_TO_BUILD == 'both' }
            }
            steps {
                script {
                    withCredentials([string(credentialsId: 'NEXT_PUBLIC_BASE_URL', variable: 'NEXT_PUBLIC_BASE_URL')]) {
                        sh """
                            docker build \
                                --build-arg NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL} \
                                -t ${FRONTEND_IMAGE} \
                                ${FRONTEND_PATH}
                            docker tag ${FRONTEND_IMAGE} ${REGISTRY}/${FRONTEND_IMAGE}
                        """
                    }
                }
            }
        }

        stage('Build Backend') {
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

        stage('Push Frontend Image') {
            when {
                expression { params.APP_TO_BUILD == 'frontend' || params.APP_TO_BUILD == 'both' }
            }
            steps {
                sh "docker push ${REGISTRY}/${FRONTEND_IMAGE}"
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

        stage('Deploy Frontend') {
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

                    for (host in deployHosts) {
                        sh """
                            docker -H tcp://${host}:2375 pull ${REGISTRY}/${FRONTEND_IMAGE}
                            docker -H tcp://${host}:2375 stop ${FRONTEND_IMAGE} || true
                            docker -H tcp://${host}:2375 rm ${FRONTEND_IMAGE} || true
                            docker -H tcp://${host}:2375 run -d --name ${FRONTEND_IMAGE} -p 3000:3000 --network app ${REGISTRY}/${FRONTEND_IMAGE}
                        """
                    }
                }
            }
        }

        stage('Deploy Backend') {
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
                        string(credentialsId: 'MONGO_URI', variable: 'MONGO_URI'),
                        string(credentialsId: 'ACCESS_TOKEN_SECRET', variable: 'ACCESS_TOKEN_SECRET')
                    ]) {
                        for (host in deployHosts) {
                            sh """
                                docker -H tcp://${host}:2375 pull ${REGISTRY}/${BACKEND_IMAGE}
                                docker -H tcp://${host}:2375 stop ${BACKEND_IMAGE} || true
                                docker -H tcp://${host}:2375 rm ${BACKEND_IMAGE} || true
                                docker -H tcp://${host}:2375 run -d \
                                    --name ${BACKEND_IMAGE} \
                                    -p 5000:5000 \
                                    --network app \
                                    -e MONGO_URI="${MONGO_URI}" \
                                    -e ACCESS_TOKEN_SECRET="${ACCESS_TOKEN_SECRET}" \
                                    ${REGISTRY}/${BACKEND_IMAGE}
                            """
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}