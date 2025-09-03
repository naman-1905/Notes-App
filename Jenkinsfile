pipeline {
  agent any

  environment {
    REGISTRY        = "10.243.4.236:5000"
    TAG             = "latest"
    DOCKER_HOST     = "tcp://10.243.52.185:2375"
    APP_NETWORK     = "app"

    FRONTEND_IMAGE  = "halfskirmish_notes_frontend"
    BACKEND_IMAGE   = "halfskirmish_notes_backend"
    
    // Deployment names following the weather app pattern
    FRONTEND_DEPLOYMENT = "halfskirmish-notes-frontend"
    BACKEND_DEPLOYMENT  = "halfskirmish-notes-backend"

    FRONTEND_BUILD_CONTEXT = "frontend/notes-app"
    BACKEND_BUILD_CONTEXT  = "backend"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build Docker Images') {
      steps {
        script {
          echo 'Building Frontend Docker Image...'
          sh """
            docker build -t ${FRONTEND_IMAGE}:${TAG} \\
              --build-arg NEXT_PUBLIC_BASE_URL=https://notes.halfskirmish.com/api \\
              -f ${FRONTEND_BUILD_CONTEXT}/Dockerfile ${FRONTEND_BUILD_CONTEXT}
          """

          echo 'Building Backend Docker Image...'
          sh """
            docker build -t ${BACKEND_IMAGE}:${TAG} -f ${BACKEND_BUILD_CONTEXT}/Dockerfile ${BACKEND_BUILD_CONTEXT}
          """
        }
      }
    }

    stage('Tag Images for Registry') {
      steps {
        script {
          echo 'Tagging images for remote registry...'
          sh "docker tag ${FRONTEND_IMAGE}:${TAG} ${REGISTRY}/${FRONTEND_IMAGE}:${TAG}"
          sh "docker tag ${BACKEND_IMAGE}:${TAG} ${REGISTRY}/${BACKEND_IMAGE}:${TAG}"
        }
      }
    }

    stage('Push Images to Registry') {
      steps {
        script {
          echo 'Pushing Docker Images to Registry...'
          sh "docker push ${REGISTRY}/${FRONTEND_IMAGE}:${TAG}"
          sh "docker push ${REGISTRY}/${BACKEND_IMAGE}:${TAG}"
        }
      }
    }

    stage('Deploy to Remote Docker') {
      steps {
        script {
          echo "Deploying Notes App on remote Docker host..."

          // Create app network if not exists
          sh """
            docker -H ${DOCKER_HOST} network inspect ${APP_NETWORK} >/dev/null 2>&1 || \
            docker -H ${DOCKER_HOST} network create ${APP_NETWORK}
          """

          // Stop and remove old backend container if running
          sh """
            docker -H ${DOCKER_HOST} ps -q --filter name=${BACKEND_DEPLOYMENT} | grep -q . && \
            docker -H ${DOCKER_HOST} stop ${BACKEND_DEPLOYMENT} || true
          """
          sh """
            docker -H ${DOCKER_HOST} ps -aq --filter name=${BACKEND_DEPLOYMENT} | grep -q . && \
            docker -H ${DOCKER_HOST} rm ${BACKEND_DEPLOYMENT} || true
          """

          // Stop and remove old frontend container if running  
          sh """
            docker -H ${DOCKER_HOST} ps -q --filter name=${FRONTEND_DEPLOYMENT} | grep -q . && \
            docker -H ${DOCKER_HOST} stop ${FRONTEND_DEPLOYMENT} || true
          """
          sh """
            docker -H ${DOCKER_HOST} ps -aq --filter name=${FRONTEND_DEPLOYMENT} | grep -q . && \
            docker -H ${DOCKER_HOST} rm ${FRONTEND_DEPLOYMENT} || true
          """

          // Deploy backend with config injection
          withCredentials([string(credentialsId: 'BACKEND_CONFIG_JSON', variable: 'BACKEND_CONFIG_JSON')]) {
            sh '''
              # Write backend config to temporary file
              printf "%s" "$BACKEND_CONFIG_JSON" > backend-config.json
              
              # Create backend container (stopped)
              BACKEND_CID=$(docker -H ${DOCKER_HOST} create --name ${BACKEND_DEPLOYMENT} --network ${APP_NETWORK} ${REGISTRY}/${BACKEND_IMAGE}:${TAG})
              
              # Copy config into container
              docker -H ${DOCKER_HOST} cp backend-config.json ${BACKEND_CID}:/app/config.json
              
              # Start backend container
              docker -H ${DOCKER_HOST} start ${BACKEND_CID}
              
              # Clean up temp file
              rm backend-config.json
            '''
          }

          // Run frontend container (connecting to backend via network)
          sh """
            docker -H ${DOCKER_HOST} run -d --name ${FRONTEND_DEPLOYMENT} \\
            --network ${APP_NETWORK} \\
            ${REGISTRY}/${FRONTEND_IMAGE}:${TAG}
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
        }
      }
    }
  }

  post {
    success {
      echo "Notes App deployment finished successfully."
      echo "Frontend accessible via service name: ${FRONTEND_DEPLOYMENT}"
      echo "Backend accessible via service name: ${BACKEND_DEPLOYMENT}"
    }
    failure {
      echo "Notes App deployment failed - check console output."
    }
  }
}