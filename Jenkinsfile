pipeline {
  agent any

  environment {
    REGISTRY        = "10.243.4.236:5000"                   // change if needed
    TAG             = "latest"
    DOCKER_HOST     = "tcp://10.243.52.185:2375"            // remote docker host
    APP_NETWORK     = "app"

    FRONTEND_IMAGE  = "halfskirmish_notes_frontend"
    BACKEND_IMAGE   = "halfskirmish_notes_backend"

    FRONTEND_BUILD_CONTEXT = "frontend/notes-app"
    BACKEND_BUILD_CONTEXT  = "backend"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build Images') {
      steps {
        script {
          echo "Building frontend image..."
          // Build frontend and pass build arg so NEXT_PUBLIC_BASE_URL embeds backend address
          sh """
            docker build -t ${FRONTEND_IMAGE}:${TAG} \\
              --build-arg NEXT_PUBLIC_BASE_URL=http://backend:5000 \\
              -f ${FRONTEND_BUILD_CONTEXT}/Dockerfile ${FRONTEND_BUILD_CONTEXT}
          """

          echo "Building backend image..."
          sh """
            docker build -t ${BACKEND_IMAGE}:${TAG} -f ${BACKEND_BUILD_CONTEXT}/Dockerfile ${BACKEND_BUILD_CONTEXT}
          """
        }
      }
    }

    stage('Tag + Push') {
      steps {
        script {
          // Optional registry login if credentials provided
          withCredentials([usernamePassword(credentialsId: 'REGISTRY_CREDS', usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')]) {
            sh '''
              if [ -n "${REG_USER}" ]; then
                echo "Logging into registry..."
                docker login -u "${REG_USER}" -p "${REG_PASS}" ${REGISTRY}
              fi
            '''
          }

          sh "docker tag ${FRONTEND_IMAGE}:${TAG} ${REGISTRY}/${FRONTEND_IMAGE}:${TAG}"
          sh "docker tag ${BACKEND_IMAGE}:${TAG} ${REGISTRY}/${BACKEND_IMAGE}:${TAG}"

          sh "docker push ${REGISTRY}/${FRONTEND_IMAGE}:${TAG}"
          sh "docker push ${REGISTRY}/${BACKEND_IMAGE}:${TAG}"
        }
      }
    }

    stage('Deploy to remote Docker host') {
      steps {
        script {
          // Create temp files from Jenkins secrets and deploy containers to remote host
          withCredentials([
            string(credentialsId: 'BACKEND_CONFIG_JSON', variable: 'BACKEND_CONFIG_JSON'),
            file(credentialsId: 'CLOUDFLARE_CREDS_FILE', variable: 'CLOUDFLARE_CREDS_LOCAL'),
            file(credentialsId: 'CLOUDFLARE_CONFIG_FILE', variable: 'CLOUDFLARE_CONFIG_LOCAL')
          ]) {
            sh '''
              set -e

              # write backend config.json from secret-text to workspace file
              printf "%s" "$BACKEND_CONFIG_JSON" > backend-config.json
              echo "Wrote backend-config.json (workspace)."

              # Ensure remote network exists
              docker -H ${DOCKER_HOST} network inspect ${APP_NETWORK} >/dev/null 2>&1 || \
                docker -H ${DOCKER_HOST} network create ${APP_NETWORK}

              # Stop + remove old containers if they exist
              docker -H ${DOCKER_HOST} ps -q --filter name=frontend | grep -q . && docker -H ${DOCKER_HOST} stop frontend || true
              docker -H ${DOCKER_HOST} ps -aq --filter name=frontend | grep -q . && docker -H ${DOCKER_HOST} rm frontend || true

              docker -H ${DOCKER_HOST} ps -q --filter name=backend | grep -q . && docker -H ${DOCKER_HOST} stop backend || true
              docker -H ${DOCKER_HOST} ps -aq --filter name=backend | grep -q . && docker -H ${DOCKER_HOST} rm backend || true

              docker -H ${DOCKER_HOST} ps -q --filter name=cloudflared | grep -q . && docker -H ${DOCKER_HOST} stop cloudflared || true
              docker -H ${DOCKER_HOST} ps -aq --filter name=cloudflared | grep -q . && docker -H ${DOCKER_HOST} rm cloudflared || true

              # Pull fresh images (optional; docker run will pull if missing)
              docker -H ${DOCKER_HOST} pull ${REGISTRY}/${BACKEND_IMAGE}:${TAG} || true
              docker -H ${DOCKER_HOST} pull ${REGISTRY}/${FRONTEND_IMAGE}:${TAG} || true

              ### BACKEND: create container, copy config.json into it, then start ###
              echo "Creating backend container (stopped)..."
              BACKEND_CID=$(docker -H ${DOCKER_HOST} create --name backend --network ${APP_NETWORK} ${REGISTRY}/${BACKEND_IMAGE}:${TAG})
              echo "Backend container created: $BACKEND_CID"

              # Copy backend-config.json (local workspace file) into remote container
              docker -H ${DOCKER_HOST} cp backend-config.json ${BACKEND_CID}:/app/config.json
              echo "Copied config.json into backend container."

              # Start backend
              docker -H ${DOCKER_HOST} start ${BACKEND_CID}
              echo "Backend started."

              ### FRONTEND: run (frontend expects backend reachable at 'http://backend:5000' inside docker network) ###
              echo "Running frontend container (will be removed if exists)..."
              docker -H ${DOCKER_HOST} run -d --name frontend --network ${APP_NETWORK} -p 3000:3000 ${REGISTRY}/${FRONTEND_IMAGE}:${TAG}

              ### CLOUDFLARED: create container, copy credentials + config, then start ###
              # Use the official cloudflared image
              CLOUDFLARED_IMG=cloudflare/cloudflared:latest

              echo "Creating cloudflared container..."
              CLOUDFLARED_CID=$(docker -H ${DOCKER_HOST} create --name cloudflared --network ${APP_NETWORK} ${CLOUDFLARED_IMG} tunnel run --config /etc/cloudflared/config.yml)
              echo "cloudflared container created: $CLOUDFLARED_CID"

              # copy credentials.json and config.yml into container
              docker -H ${DOCKER_HOST} cp "${CLOUDFLARE_CREDS_LOCAL}" ${CLOUDFLARED_CID}:/etc/cloudflared/credentials.json
              docker -H ${DOCKER_HOST} cp "${CLOUDFLARE_CONFIG_LOCAL}" ${CLOUDFLARED_CID}:/etc/cloudflared/config.yml
              echo "Copied cloudflared credentials and config."

              docker -H ${DOCKER_HOST} start ${CLOUDFLARED_CID}
              echo "cloudflared started."

              # give things a second to come up
              sleep 5

              echo "Deployment complete."
            '''
          } // withCredentials
        } // script
      } // steps
    } // Deploy stage

    stage('Cleanup Local') {
      steps {
        sh "docker image prune -f || true"
      }
    }
  } // stages

  post {
    success {
      echo "Pipeline finished successfully."
    }
    failure {
      echo "Pipeline failed - check console output."
    }
  }
}
