async function test() {
    try {
        console.log('Logging in...');
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: 'STU001', password: 'password123', role: 'student' })
        });
        const cookie = loginRes.headers.get('set-cookie');
        console.log('Login Response:', await loginRes.json());
        if (!cookie) {
            console.error('No cookie received!');
            return;
        }

        console.log('Uploading resume...');
        const formData = new FormData();
        formData.append('resume', new Blob(['My skills are React and Node.js']), 'resume.txt');

        const uploadRes = await fetch('http://localhost:5000/api/student/resume', {
            method: 'POST',
            headers: { 'Cookie': cookie },
            body: formData
        });
        console.log('Upload Status:', uploadRes.status);
        console.log('Upload Response:', await uploadRes.json());
    } catch (err) {
        console.error('Error:', err);
    }
}
test();
