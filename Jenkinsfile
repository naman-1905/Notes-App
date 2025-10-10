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
        BACKEND_PORT = "8000"
        FRONTEND_PORT = "3000"
        NETWORK = "app"
    }

    stages {
        stage('Set Registry') {
            steps {
                script {
                    if (params.REGISTRY_OPTION == 'Kshitiz Container (10.243.4.236:5000)') {
                        env.REGISTRY = "10.243.4.236:5000"
                    } else {
                        env.REGISTRY = "10.243.250.132:5000"
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

        stage('Cleanup Ports') {
            steps {
                script {
                    def deployHosts = []
                    if (params.DEPLOY_HOST == 'both') {
                        deployHosts = ['10.243.4.236', '10.243.250.132']
                    } else {
                        deployHosts = [params.DEPLOY_HOST]
                    }
                    
                    for (host in deployHosts) {
                        if (params.APP_TO_BUILD == 'backend' || params.APP_TO_BUILD == 'both') {
                            sh """
                                echo "Cleaning up port ${BACKEND_PORT} on ${host}..."
                                
                                # Find and stop all containers using backend port
                                BACKEND_CONTAINERS=\$(docker -H tcp://${host}:2375 ps -q --filter "publish=${BACKEND_PORT}" 2>/dev/null || true)
                                if [ -n "\$BACKEND_CONTAINERS" ]; then
                                    echo "Stopping containers using port ${BACKEND_PORT}: \$BACKEND_CONTAINERS"
                                    docker -H tcp://${host}:2375 stop \$BACKEND_CONTAINERS || true
                                    docker -H tcp://${host}:2375 rm \$BACKEND_CONTAINERS || true
                                fi
                                
                                # Also cleanup by name
                                docker -H tcp://${host}:2375 stop ${BACKEND_IMAGE} 2>/dev/null || true
                                docker -H tcp://${host}:2375 rm ${BACKEND_IMAGE} 2>/dev/null || true
                                
                                echo "✓ Port ${BACKEND_PORT} cleaned up on ${host}"
                            """
                        }
                        
                        if (params.APP_TO_BUILD == 'frontend' || params.APP_TO_BUILD == 'both') {
                            sh """
                                echo "Cleaning up port ${FRONTEND_PORT} on ${host}..."
                                
                                # Find and stop all containers using frontend port
                                FRONTEND_CONTAINERS=\$(docker -H tcp://${host}:2375 ps -q --filter "publish=${FRONTEND_PORT}" 2>/dev/null || true)
                                if [ -n "\$FRONTEND_CONTAINERS" ]; then
                                    echo "Stopping containers using port ${FRONTEND_PORT}: \$FRONTEND_CONTAINERS"
                                    docker -H tcp://${host}:2375 stop \$FRONTEND_CONTAINERS || true
                                    docker -H tcp://${host}:2375 rm \$FRONTEND_CONTAINERS || true
                                fi
                                
                                # Also cleanup by name
                                docker -H tcp://${host}:2375 stop ${FRONTEND_IMAGE} 2>/dev/null || true
                                docker -H tcp://${host}:2375 rm ${FRONTEND_IMAGE} 2>/dev/null || true
                                
                                echo "✓ Port ${FRONTEND_PORT} cleaned up on ${host}"
                            """
                        }
                        
                        // Wait for ports to be fully released
                        sh "sleep 3"
                    }
                }
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
                                echo "Deploying Backend to ${host}:${BACKEND_PORT}..."
                                
                                # Pull latest image
                                docker -H tcp://${host}:2375 pull ${REGISTRY}/${BACKEND_IMAGE}
                                
                                # Run new container
                                docker -H tcp://${host}:2375 run -d \
                                    --name ${BACKEND_IMAGE} \
                                    --network ${NETWORK} \
                                    --restart unless-stopped \
                                    -p ${BACKEND_PORT}:${BACKEND_PORT} \
                                    -e ACCESS_TOKEN_SECRET="\${TOKEN_SECRET}" \
                                    -e PORT=${BACKEND_PORT} \
                                    -e MONGO_URI="\${MONGO_CONNECTION}" \
                                    ${REGISTRY}/${BACKEND_IMAGE}
                                
                                echo "✓ Backend deployed on ${host}:${BACKEND_PORT}"
                                
                                # Verify container is running
                                docker -H tcp://${host}:2375 ps --filter "name=${BACKEND_IMAGE}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
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
                                echo "Deploying Frontend to ${host}:${FRONTEND_PORT}..."
                                
                                # Pull latest image
                                docker -H tcp://${host}:2375 pull ${REGISTRY}/${FRONTEND_IMAGE}
                                
                                # Run new container
                                docker -H tcp://${host}:2375 run -d \
                                    --name ${FRONTEND_IMAGE} \
                                    --network ${NETWORK} \
                                    --restart unless-stopped \
                                    -p ${FRONTEND_PORT}:${FRONTEND_PORT} \
                                    -e NEXT_PUBLIC_BASE_URL="\${BASE_URL}" \
                                    ${REGISTRY}/${FRONTEND_IMAGE}
                                
                                echo "✓ Frontend deployed on ${host}:${FRONTEND_PORT}"
                                
                                # Verify container is running
                                docker -H tcp://${host}:2375 ps --filter "name=${FRONTEND_IMAGE}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
                            """
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo "========================================="
            echo "✓ Deployment completed successfully!"
        }
        failure {
            echo "✗ Deployment failed. Check the logs."
        }
        always {
            sh "docker system prune -f || true"
        }
    }
}