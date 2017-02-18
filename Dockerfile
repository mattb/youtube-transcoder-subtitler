FROM node:alpine

ENV FFMPEG_VERSION=3.0.2

WORKDIR /tmp/ffmpeg

RUN apk add --update build-base curl nasm tar bzip2 python python-dev py-pip \
  make gcc g++ linux-headers binutils-gold coreutils gnupg libstdc++ \
  zlib-dev openssl-dev yasm-dev lame-dev libogg-dev x264-dev libvpx-dev libvorbis-dev x265-dev freetype-dev libass-dev libwebp-dev libtheora-dev opus-dev

RUN DIR=$(mktemp -d) && cd ${DIR} && \
  curl -s http://ffmpeg.org/releases/ffmpeg-${FFMPEG_VERSION}.tar.gz | tar zxvf - -C . && \
  cd ffmpeg-${FFMPEG_VERSION} && \
  ./configure \
  --enable-version3 --enable-gpl --enable-nonfree --enable-small --enable-libmp3lame --enable-libx264 --enable-libx265 --enable-libvpx --enable-libtheora --enable-libvorbis --enable-libopus --enable-libass --enable-libwebp --enable-postproc --enable-avresample --enable-libfreetype --enable-openssl --disable-debug && \
  make && \
  make install && \
  make distclean && \
  rm -rf ${DIR}

RUN pip install --upgrade youtube_dl

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN npm install -g yarn 
COPY yarn.lock package.json /usr/src/app/
RUN yarn install

COPY . /usr/src/app

RUN npm run build

EXPOSE 3000

CMD ["npm", "start" ]
