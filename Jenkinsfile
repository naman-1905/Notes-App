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
            description: 'Select deployment target'
        )
    }

    environment {
        BACKEND_IMAGE = "notes-app-backend"
        FRONTEND_IMAGE = "notes-app-frontend"
        BACKEND_PATH = "backend"
        FRONTEND_PATH = "frontend/notes-app"
        BACKEND_PORT = "5000"
        FRONTEND_PORT = "3000"
        PRIMARY_REGISTRY = "registrypush.kahitoz.com:5000"
        SECONDARY_REGISTRY = "registry.kahitoz.com"
        DOCKER_CREDS = credentials('docker_creds')
        KAHITOZ_HOST = "tcp://kahitozrunner:2375"
        NAMAN_HOST = "tcp://naman:2375"
    }

    stages {
        stage('Build Backend Docker Image') {
            when {
                expression { params.APP_TO_BUILD == 'backend' || params.APP_TO_BUILD == 'both' }
            }
            steps {
                script {
                    echo "Building Backend Docker Image"
                    sh """
                        docker build -t ${BACKEND_IMAGE}:${BUILD_NUMBER} ${BACKEND_PATH}
                        docker tag ${BACKEND_IMAGE}:${BUILD_NUMBER} ${BACKEND_IMAGE}:latest
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
                        echo "Building Frontend Docker Image"
                        sh """
                            docker build \
                                --build-arg NEXT_PUBLIC_BASE_URL=\${BASE_URL} \
                                -t ${FRONTEND_IMAGE}:${BUILD_NUMBER} ${FRONTEND_PATH}
                            docker tag ${FRONTEND_IMAGE}:${BUILD_NUMBER} ${FRONTEND_IMAGE}:latest
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
                script {
                    echo "Pushing Backend to registries"
                    sh """
                        # Login to registries
                        echo \${DOCKER_CREDS_PSW} | docker login ${PRIMARY_REGISTRY} -u \${DOCKER_CREDS_USR} --password-stdin
                        echo \${DOCKER_CREDS_PSW} | docker login ${SECONDARY_REGISTRY} -u \${DOCKER_CREDS_USR} --password-stdin
                        
                        # Push to primary registry
                        docker tag ${BACKEND_IMAGE}:latest ${PRIMARY_REGISTRY}/${BACKEND_IMAGE}:${BUILD_NUMBER}
                        docker tag ${BACKEND_IMAGE}:latest ${PRIMARY_REGISTRY}/${BACKEND_IMAGE}:latest
                        docker push ${PRIMARY_REGISTRY}/${BACKEND_IMAGE}:${BUILD_NUMBER}
                        docker push ${PRIMARY_REGISTRY}/${BACKEND_IMAGE}:latest
                        
                        # Push to secondary registry
                        docker tag ${BACKEND_IMAGE}:latest ${SECONDARY_REGISTRY}/${BACKEND_IMAGE}:${BUILD_NUMBER}
                        docker tag ${BACKEND_IMAGE}:latest ${SECONDARY_REGISTRY}/${BACKEND_IMAGE}:latest
                        docker push ${SECONDARY_REGISTRY}/${BACKEND_IMAGE}:${BUILD_NUMBER}
                        docker push ${SECONDARY_REGISTRY}/${BACKEND_IMAGE}:latest
                    """
                }
            }
        }

        stage('Push Frontend Image') {
            when {
                expression { params.APP_TO_BUILD == 'frontend' || params.APP_TO_BUILD == 'both' }
            }
            steps {
                script {
                    echo "Pushing Frontend to registries"
                    sh """
                        # Login to registries
                        echo \${DOCKER_CREDS_PSW} | docker login ${PRIMARY_REGISTRY} -u \${DOCKER_CREDS_USR} --password-stdin
                        echo \${DOCKER_CREDS_PSW} | docker login ${SECONDARY_REGISTRY} -u \${DOCKER_CREDS_USR} --password-stdin
                        
                        # Push to primary registry
                        docker tag ${FRONTEND_IMAGE}:latest ${PRIMARY_REGISTRY}/${FRONTEND_IMAGE}:${BUILD_NUMBER}
                        docker tag ${FRONTEND_IMAGE}:latest ${PRIMARY_REGISTRY}/${FRONTEND_IMAGE}:latest
                        docker push ${PRIMARY_REGISTRY}/${FRONTEND_IMAGE}:${BUILD_NUMBER}
                        docker push ${PRIMARY_REGISTRY}/${FRONTEND_IMAGE}:latest
                        
                        # Push to secondary registry
                        docker tag ${FRONTEND_IMAGE}:latest ${SECONDARY_REGISTRY}/${FRONTEND_IMAGE}:${BUILD_NUMBER}
                        docker tag ${FRONTEND_IMAGE}:latest ${SECONDARY_REGISTRY}/${FRONTEND_IMAGE}:latest
                        docker push ${SECONDARY_REGISTRY}/${FRONTEND_IMAGE}:${BUILD_NUMBER}
                        docker push ${SECONDARY_REGISTRY}/${FRONTEND_IMAGE}:latest
                    """
                }
            }
        }

        stage('Deploy Backend Container') {
            when {
                expression { params.APP_TO_BUILD == 'backend' || params.APP_TO_BUILD == 'both' }
            }
            steps {
                script {
                    def deployHosts = getDeployHosts()
                    
                    withCredentials([
                        string(credentialsId: 'ACCESS_TOKEN_SECRET', variable: 'TOKEN_SECRET'),
                        string(credentialsId: 'MONGO_URI', variable: 'MONGO_CONNECTION')
                    ]) {
                        if (params.DEPLOY_TARGET == 'both') {
                            def parallelDeploy = [:]
                            
                            deployHosts.each { target ->
                                parallelDeploy[target.name] = {
                                    deployBackend(target.host, target.name, env.TOKEN_SECRET, env.MONGO_CONNECTION)
                                }
                            }
                            
                            parallel parallelDeploy
                        } else {
                            deployBackend(deployHosts[0].host, deployHosts[0].name, env.TOKEN_SECRET, env.MONGO_CONNECTION)
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
                    def deployHosts = getDeployHosts()
                    
                    withCredentials([string(credentialsId: 'NEXT_PUBLIC_BASE_URL', variable: 'BASE_URL')]) {
                        if (params.DEPLOY_TARGET == 'both') {
                            def parallelDeploy = [:]
                            
                            deployHosts.each { target ->
                                parallelDeploy[target.name] = {
                                    deployFrontend(target.host, target.name, env.BASE_URL)
                                }
                            }
                            
                            parallel parallelDeploy
                        } else {
                            deployFrontend(deployHosts[0].host, deployHosts[0].name, env.BASE_URL)
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo "✅ Deployment completed successfully!"
            echo "App: ${params.APP_TO_BUILD} | Target: ${params.DEPLOY_TARGET} | Build: #${BUILD_NUMBER}"
        }
        failure {
            echo "❌ Deployment failed. Please check the logs."
        }
        always {
            script {
                sh """
                    docker logout ${PRIMARY_REGISTRY} || true
                    docker logout ${SECONDARY_REGISTRY} || true
                    docker system prune -f || true
                """
            }
        }
    }
}

// Helper function to determine deployment hosts
def getDeployHosts() {
    if (params.DEPLOY_TARGET == 'both') {
        return [
            [name: 'kahitoz', host: env.KAHITOZ_HOST],
            [name: 'naman', host: env.NAMAN_HOST]
        ]
    } else if (params.DEPLOY_TARGET == 'kahitoz') {
        return [[name: 'kahitoz', host: env.KAHITOZ_HOST]]
    } else {
        return [[name: 'naman', host: env.NAMAN_HOST]]
    }
}

// Helper function to deploy backend
def deployBackend(String dockerHost, String targetName, String tokenSecret, String mongoUri) {
    echo "Deploying Backend to ${targetName} (${dockerHost})"
    
    sh """
        # Authenticate remote Docker with registry
        docker -H ${dockerHost} login ${PRIMARY_REGISTRY} -u \${DOCKER_CREDS_USR} -p \${DOCKER_CREDS_PSW}
        
        # Pull the latest image
        docker -H ${dockerHost} pull ${PRIMARY_REGISTRY}/${BACKEND_IMAGE}:latest
        
        # Stop and remove existing container
        docker -H ${dockerHost} stop ${BACKEND_IMAGE} || true
        docker -H ${dockerHost} rm ${BACKEND_IMAGE} || true
        
        # Run new container
        docker -H ${dockerHost} run -d \\
            --name ${BACKEND_IMAGE} \\
            --network app \\
            --restart unless-stopped \\
            -e ACCESS_TOKEN_SECRET=${tokenSecret} \\
            -e PORT=${BACKEND_PORT} \\
            -e MONGO_URI=${mongoUri} \\
            ${PRIMARY_REGISTRY}/${BACKEND_IMAGE}:latest
        
        # Verify deployment
        docker -H ${dockerHost} ps | grep ${BACKEND_IMAGE}
    """
    
    echo "✅ Backend deployed successfully to ${targetName}"
}

// Helper function to deploy frontend
def deployFrontend(String dockerHost, String targetName, String baseUrl) {
    echo "Deploying Frontend to ${targetName} (${dockerHost})"
    
    sh """
        # Authenticate remote Docker with registry
        docker -H ${dockerHost} login ${PRIMARY_REGISTRY} -u \${DOCKER_CREDS_USR} -p \${DOCKER_CREDS_PSW}
        
        # Pull the latest image
        docker -H ${dockerHost} pull ${PRIMARY_REGISTRY}/${FRONTEND_IMAGE}:latest
        
        # Stop and remove existing container
        docker -H ${dockerHost} stop ${FRONTEND_IMAGE} || true
        docker -H ${dockerHost} rm ${FRONTEND_IMAGE} || true
        
        # Run new container
        docker -H ${dockerHost} run -d \\
            --name ${FRONTEND_IMAGE} \\
            --network app \\
            --restart unless-stopped \\
            -e NEXT_PUBLIC_BASE_URL=${baseUrl} \\
            ${PRIMARY_REGISTRY}/${FRONTEND_IMAGE}:latest
        
        # Verify deployment
        docker -H ${dockerHost} ps | grep ${FRONTEND_IMAGE}
    """
    
    echo "✅ Frontend deployed successfully to ${targetName}"
}