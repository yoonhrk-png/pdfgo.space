body {
  font-family: system-ui, sans-serif;
  background: #f8fafc;
  padding: 30px;
}

.container {
  max-width: 520px;
  margin: auto;
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,.08);
}

h1 {
  text-align: center;
  margin-bottom: 20px;
}

#drop-zone {
  border: 2px dashed #94a3b8;
  padding: 40px;
  text-align: center;
  border-radius: 14px;
  cursor: pointer;
  transition: 0.2s;
}

#drop-zone.dragover {
  border-color: #6366f1;
  background: #eef2ff;
}

.options {
  display: flex;
  gap: 10px;
  margin: 16px 0;
}

.options input {
  width: 100%;
  padding: 8px;
}

button {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

button:disabled {
  opacity: .5;
}

progress {
  width: 100%;
  height: 16px;
  margin-top: 14px;
}

footer {
  text-align: center;
  font-size: 12px;
  margin-top: 20px;
  color: #64748b;
}
