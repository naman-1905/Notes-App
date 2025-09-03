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
        
        // Production URLs
        FRONTEND_URL = "https://notes.halfskirmish.com"
        BACKEND_URL = "https://apinotes.halfskirmish.com"
    }

    stages {
        stage('Checkout') {
            steps { 
                checkout scm 
                sh 'ls -la'
            }
        }

        stage('Prepare Environment') {
            steps {
                withCredentials([string(credentialsId: 'NOTES_BACKEND_ENV', variable: 'BACKEND_ENV_CONTENT')]) {
                    sh '''
                        # Create backend .env file
                        echo "$BACKEND_ENV_CONTENT" > backend/.env
                        
                        # Ensure .env file exists and is readable
                        if [ -f backend/.env ]; then
                            echo "Backend .env file created successfully"
                            ls -la backend/.env
                        else
                            echo "Failed to create backend .env file"
                            exit 1
                        fi
                    '''
                }
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Build Backend') {
                    steps {
                        script {
                            echo 'Building backend image...'
                            sh """
                                cd ${BACKEND_BUILD_CONTEXT}
                                docker build -t ${BACKEND_IMAGE}:${TAG} .
                            """
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        script {
                            echo 'Building frontend image with production API URL...'
                            sh """
                                cd ${FRONTEND_BUILD_CONTEXT}
                                docker build -t ${FRONTEND_IMAGE}:${TAG} \
                                --build-arg NEXT_PUBLIC_BASE_URL=${BACKEND_URL} .
                            """
                        }
                    }
                }
            }
        }

        stage('Push Images to Registry') {
            parallel {
                stage('Push Backend') {
                    steps {
                        script {
                            echo 'Pushing backend image...'
                            sh """
                                docker tag ${BACKEND_IMAGE}:${TAG} ${REGISTRY}/${BACKEND_IMAGE}:${TAG}
                                docker push ${REGISTRY}/${BACKEND_IMAGE}:${TAG}
                            """
                        }
                    }
                }
                stage('Push Frontend') {
                    steps {
                        script {
                            echo 'Pushing frontend image...'
                            sh """
                                docker tag ${FRONTEND_IMAGE}:${TAG} ${REGISTRY}/${FRONTEND_IMAGE}:${TAG}
                                docker push ${REGISTRY}/${FRONTEND_IMAGE}:${TAG}
                            """
                        }
                    }
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

                    // Stop and remove existing containers
                    echo 'Stopping existing containers...'
                    sh """
                        docker -H ${DOCKER_HOST} stop ${BACKEND_DEPLOYMENT} ${FRONTEND_DEPLOYMENT} || true
                        docker -H ${DOCKER_HOST} rm ${BACKEND_DEPLOYMENT} ${FRONTEND_DEPLOYMENT} || true
                    """

                    // Pull latest images on remote
                    echo 'Pulling latest images...'
                    sh """
                        docker -H ${DOCKER_HOST} pull ${REGISTRY}/${BACKEND_IMAGE}:${TAG}
                        docker -H ${DOCKER_HOST} pull ${REGISTRY}/${FRONTEND_IMAGE}:${TAG}
                    """

                    // Backend deployment
                    echo 'Deploying backend...'
                    sh """
                        docker -H ${DOCKER_HOST} run -d --name ${BACKEND_DEPLOYMENT} \\
                            --network ${APP_NETWORK} \\
                            --restart unless-stopped \\
                            -p 5000:5000 \\
                            -e NODE_ENV=production \\
                            --health-cmd="wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1" \\
                            --health-interval=30s \\
                            --health-timeout=3s \\
                            --health-retries=3 \\
                            ${REGISTRY}/${BACKEND_IMAGE}:${TAG}
                    """

                    // Frontend deployment
                    echo 'Deploying frontend...'
                    sh """
                        docker -H ${DOCKER_HOST} run -d --name ${FRONTEND_DEPLOYMENT} \\
                            --network ${APP_NETWORK} \\
                            --restart unless-stopped \\
                            -p 3000:3000 \\
                            -e NODE_ENV=production \\
                            --health-cmd="wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1" \\
                            --health-interval=30s \\
                            --health-timeout=3s \\
                            --health-retries=3 \\
                            ${REGISTRY}/${FRONTEND_IMAGE}:${TAG}
                    """
                }
            }
        }

        stage('Health Check & Debugging') {
            steps {
                script {
                    echo 'Detailed container debugging...'
                    sh """
                        echo "=== CONTAINER STATUS ==="
                        docker -H ${DOCKER_HOST} ps -a | grep halfskirmish || echo "No halfskirmish containers found"
                        
                        echo "=== NETWORK INSPECTION ==="
                        docker -H ${DOCKER_HOST} network inspect ${APP_NETWORK} | grep -A 10 -B 5 halfskirmish || echo "No containers in network"
                        
                        echo "=== BACKEND CONTAINER DETAILS ==="
                        if docker -H ${DOCKER_HOST} ps | grep ${BACKEND_DEPLOYMENT}; then
                            echo "Backend container is running"
                            
                            echo "--- Backend Logs (last 50 lines) ---"
                            docker -H ${DOCKER_HOST} logs --tail 50 ${BACKEND_DEPLOYMENT} || echo "No backend logs"
                            
                            echo "--- Backend Internal Test ---"
                            docker -H ${DOCKER_HOST} exec ${BACKEND_DEPLOYMENT} wget -qO- http://localhost:5000/ 2>/dev/null || echo "Internal backend test failed"
                            
                            echo "--- Backend Environment Check ---"
                            docker -H ${DOCKER_HOST} exec ${BACKEND_DEPLOYMENT} env | grep NODE || echo "No NODE env vars"
                            
                            echo "--- Backend Process Check ---"
                            docker -H ${DOCKER_HOST} exec ${BACKEND_DEPLOYMENT} ps aux || echo "Process check failed"
                            
                            echo "--- Backend Port Check ---"
                            docker -H ${DOCKER_HOST} exec ${BACKEND_DEPLOYMENT} netstat -tlnp 2>/dev/null | grep :5000 || echo "Port 5000 not listening"
                            
                        else
                            echo "Backend container is NOT running"
                            echo "--- Last Backend Container Logs ---"
                            docker -H ${DOCKER_HOST} logs ${BACKEND_DEPLOYMENT} 2>/dev/null || echo "No container logs available"
                            
                            echo "--- Backend Container Inspection ---"
                            docker -H ${DOCKER_HOST} inspect ${BACKEND_DEPLOYMENT} 2>/dev/null | grep -A 5 -B 5 "State\\|Error\\|ExitCode" || echo "Container inspect failed"
                        fi
                        
                        echo "=== FRONTEND CONTAINER DETAILS ==="
                        if docker -H ${DOCKER_HOST} ps | grep ${FRONTEND_DEPLOYMENT}; then
                            echo "Frontend container is running"
                            echo "--- Frontend Logs (last 20 lines) ---"
                            docker -H ${DOCKER_HOST} logs --tail 20 ${FRONTEND_DEPLOYMENT} || echo "No frontend logs"
                        else
                            echo "Frontend container is NOT running"
                        fi
                        
                        echo "=== PORT BINDING CHECK ==="
                        docker -H ${DOCKER_HOST} port ${BACKEND_DEPLOYMENT} 2>/dev/null || echo "No backend port bindings"
                        docker -H ${DOCKER_HOST} port ${FRONTEND_DEPLOYMENT} 2>/dev/null || echo "No frontend port bindings"
                        
                        echo "=== HOST PORT CHECK ==="
                        # Check if ports are accessible from host
                        timeout 5 sh -c 'echo > /dev/tcp/10.243.52.185/5000' && echo "Backend port 5000 accessible" || echo "Backend port 5000 NOT accessible"
                        timeout 5 sh -c 'echo > /dev/tcp/10.243.52.185/3000' && echo "Frontend port 3000 accessible" || echo "Frontend port 3000 NOT accessible"
                    """
                }
            }
        }

        stage('Cleanup Local Docker') {
            steps {
                echo 'Pruning local Docker images and containers...'
                sh """
                    docker image prune -f
                    docker container prune -f
                    docker system df
                """
            }
        }
    }

    post {
        success {
            echo """
            ================================
            Deployment finished successfully!
            ================================
            Frontend: ${FRONTEND_URL} (container: ${FRONTEND_DEPLOYMENT})
            Backend:  ${BACKEND_URL} (container: ${BACKEND_DEPLOYMENT})
            
            Container Status:
            """
            sh """
                echo "Running containers:"
                docker -H ${DOCKER_HOST} ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}" | grep halfskirmish || true
            """
        }
        failure {
            echo "Deployment failed - check logs above"
            sh """
                echo "Failed container logs:"
                docker -H ${DOCKER_HOST} logs --tail 50 ${BACKEND_DEPLOYMENT} 2>/dev/null || echo "No backend logs available"
                docker -H ${DOCKER_HOST} logs --tail 50 ${FRONTEND_DEPLOYMENT} 2>/dev/null || echo "No frontend logs available"
            """
        }
        always {
            echo 'Cleaning up build artifacts...'
            sh """
                # Clean up any dangling images
                docker image prune -f || true
            """
        }
    }
}