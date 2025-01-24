import fetch from 'node-fetch';

const testPatientLogin = async () => {
    const response = await fetch('http://localhost:8888/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: 'patient@g.com',
            password: 'Testtest123!' // Replace with actual password
        })
    });
    const result = await response.json();
    console.log('Patient login response:', result);
};

testPatientLogin();
