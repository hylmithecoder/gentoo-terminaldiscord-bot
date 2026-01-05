# FROM gentoo/portage:latest
FROM gentoo/stage3:latest

ENV SHELL=/bin/bash \
    LANG=en_US.UTF-8 \
    LC_ALL=en_US.UTF-8

RUN mkdir -p /proc /sys /dev /run

# Update dan install dependency

# RUN eselect profile set default/linux/amd64/17.1/no-multilib
RUN emerge-webrsync 
# && \
#     emerge --verbose --update --deep --newuse @world && \
#     emerge --ask=n app-shells/bash \
#                     app-admin/sudo \
#                     net-misc/curl \
#                     sys-apps/iputils \
#                     dev-vcs/git

RUN rm -f /var/cache/binpkgs/*/*partial

RUN emerge --verbose --ask=n sec-keys/openpgp-keys-gentoo-release

# Install packages (hanya binary, compile sedikit banget)
RUN emerge --verbose --ask=n bash \
                sudo \
                curl \
                iputils \
                dev-vcs/git
                # nodejs


# --------------------------
# INSTALL NGROK
# --------------------------
RUN mkdir -p /opt/ngrok && \
    curl -Lo /opt/ngrok/ngrok.tgz https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz && \
    tar -xzf /opt/ngrok/ngrok.tgz -C /opt/ngrok && \
    rm /opt/ngrok/ngrok.tgz && \
    ln -s /opt/ngrok/ngrok /usr/local/bin/ngrok
    
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash && \
# in lieu of restarting the shell
    \. "$HOME/.nvm/nvm.sh" && \
# Download and install Node.js:
    nvm install 24 && \
# Verify the Node.js version:
    node -v && \
# Verify npm version:
    npm -v

# (Optional) masukkan AUTHTOKEN biar container langsung siap
# ATAU lu bisa set via runtime `docker run -e NGROK_AUTHTOKEN=...`
ENV NGROK_AUTHTOKEN="YOUR_AUTH_TOKEN"

RUN /usr/local/bin/ngrok config add-authtoken $NGROK_AUTHTOKEN

# --------------------------

# Buat user bot
RUN useradd -m gentoobot && echo "gentoobot:botpass" | chpasswd
RUN echo "gentoobot ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers

# Folder project
RUN mkdir -p /app
WORKDIR /app

COPY . /app

RUN ls -a
RUN ls -a .. 

# RUN npm install
# Expose port untuk express + ngrok
# EXPOSE 30010

# START BOT + NGROK SEKALIGUS
# CMD ngrok http 30010 --log=stdout & npm start
