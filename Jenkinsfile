pipeline {
    agent any

    parameters {
        choice(
            name: 'APP_TO_BUILD',
            choices: ['backend', 'frontend'],
            description: 'Select which Notes App to build and deploy'
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
        BACKEND_IMAGE  = "notes_backend"
        FRONTEND_IMAGE = "notes_frontend"
        BACKEND_PATH   = "backend"
        FRONTEND_PATH  = "frontend/notes-app"
        APP_NETWORK    = "app"
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

        stage('Build Docker Image') {
            steps {
                script {
                    if (params.APP_TO_BUILD == 'backend') {
                        env.IMAGE_NAME = env.BACKEND_IMAGE
                        env.APP_PATH   = env.BACKEND_PATH
                    } else {
                        env.IMAGE_NAME = env.FRONTEND_IMAGE
                        env.APP_PATH   = env.FRONTEND_PATH
                    }

                    echo "Building Docker image for ${params.APP_TO_BUILD}..."
                    sh """
                        docker build -t \$IMAGE_NAME \$APP_PATH
                        docker tag \$IMAGE_NAME \$REGISTRY/\$IMAGE_NAME
                    """
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                echo "Pushing ${params.APP_TO_BUILD} image to ${REGISTRY}..."
                sh "docker push \$REGISTRY/\$IMAGE_NAME"
            }
        }

        stage('Deploy Container') {
            steps {
                script {
                    def deployHosts = []
                    if (params.DEPLOY_HOST == 'both') {
                        deployHosts = ['10.243.4.236', '10.243.250.132']
                    } else {
                        deployHosts = [params.DEPLOY_HOST]
                    }

                    for (host in deployHosts) {
                        echo "Deploying ${params.APP_TO_BUILD} on $host..."
                        sh """
                            docker -H tcp://$host:2375 pull $REGISTRY/$IMAGE_NAME
                            docker -H tcp://$host:2375 stop $IMAGE_NAME || true
                            docker -H tcp://$host:2375 rm $IMAGE_NAME || true
                            docker -H tcp://$host:2375 run -d --name $IMAGE_NAME --network $APP_NETWORK \
                            ${params.APP_TO_BUILD == 'backend' ? '-p 8000:8000' : '-p 3000:3000'} \
                            $REGISTRY/$IMAGE_NAME
                        """
                    }
                }
            }
        }
    }
}
