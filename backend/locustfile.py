import random
import string
from locust import HttpUser, task, between

class QuantEngineUser(HttpUser):
    wait_time = between(1, 5)

    def on_start(self):
        # Create a random user for testing
        self.username = ''.join(random.choices(string.ascii_lowercase, k=10))
        self.email = f"{self.username}@test.com"
        self.password = "SuperSecretPassword123!"
        
        # Try to register the user
        self.client.post("/api/auth/register/", json={
            "username": self.username,
            "email": self.email,
            "password": self.password
        }, name="Register")

    @task(3)
    def stress_login(self):
        # Stressing the login endpoint. Password hashing (bcrypt/pbkdf2) will heavily load the CPU.
        self.client.post("/api/auth/login/", json={
            "username": self.username,
            "password": self.password
        }, name="Login Attempt")

    @task(1)
    def stress_stocks_endpoint(self):
        # Stress the database and memory by fetching screened stocks
        self.client.get("/api/screener/stocks/", name="Fetch Stocks")
