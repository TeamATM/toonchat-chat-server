# Node.js 이미지를 기반으로 한 새 Docker 이미지를 정의합니다.
FROM node:20.5.1-slim

# 앱 디렉토리를 생성합니다.
WORKDIR /usr/src/app

# 앱 의존성을 설치하기 위한 package.json과 package-lock.json 파일을 복사합니다.
COPY package*.json ./

# 프로젝트 의존성을 설치합니다.
RUN npm install --only=production

# 앱의 소스 코드와 자원들을 Docker 이미지 안에 복사합니다.
COPY . .

# 앱이 8080 포트에서 실행될 것임을 명시적으로 선언하고, 이 포트를 외부에 노출시킵니다.
EXPOSE 80

# 컨테이너가 시작할 때 실행될 명령어를 정의합니다.
ENTRYPOINT [ "node", "dist/index.js" ]