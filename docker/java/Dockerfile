FROM eclipse-temurin:17-jdk

# Install bash (required for docker exec)
RUN apt-get update && apt-get install -y bash && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspace

# Run bash by default
CMD ["bash"]
