# AirTrace — 3-Minute Presentation Speech (Simple Indian English)

> **Speaking Time:** ~3 Minutes (Casual, confident, and conversational pace)  
> **Key Sections:** The Real Problem, Step-by-Step Flow of AirTrace, AWS Architecture (Amplify & Bedrock), Final Impact.

---

### **[0:00 – 0:35] The Hook & The Problem**

> "Good morning, everyone.
>
> Every winter across North India, especially in Delhi-NCR, we wake up, look at our phones, and see one common number: **'AQI 400 — Severe.'** 
>
> But here is the real issue: **a single city-wide AQI number doesn't tell you the air *you* are actually breathing.**
>
> If a student is cycling right next to heavy truck traffic on the Ring Road, they are breathing in way more toxic smoke than someone walking inside a green college campus just 500 meters away. But right now, daily commuters, school kids, and sports coaches have zero tools to find cleaner paths or plan their day safely. That's why we built **AirTrace**."

---

### **[0:35 – 1:45] The Solution & Step-by-Step Flow**

> "AirTrace is a practical, everyday clean-air guide. Instead of just showing scary numbers, it actively helps you reduce the pollution you breathe in. Here is how it works step-by-step:
>
> 1. **Simple Profile Setup:**  
>    When you sign up, AirTrace asks whether you are a **College Student** or a **Working Professional**. You can select your campus or office location, how you travel, and if you have any breathing sensitivities like asthma. This creates a personalized safety profile for you.
>
> 2. **Live Ground Data from CPCB Stations:**  
>    Instead of guessing air quality from satellites, our system connects directly with official **Central Pollution Control Board (CPCB)** ground stations across the city. We calculate the exact Indian National AQI for PM2.5, PM10, and other harmful gases, so you know the exact pollutant causing the danger.
>
> 3. **Clean Route Planner:**  
>    Regular Google Maps only shows you the fastest route, which often takes you right through the most polluted traffic jams. AirTrace gives you a **Clean Route Option**. We compare the fastest route with a greener, less polluted corridor, showing you how much toxic air you can save your lungs from—whether you walk, cycle, or drive.
>
> 4. **Campus Safety & Sports Clearance:**  
>    In schools and colleges, coaches often don't know whether it's safe for kids to play football or run outside. Our **Campus Decision Engine** checks the scheduled practice time against live pollution trends. If the air is dangerous at 4 PM, it clearly flags the risk and suggests a safer slot, like 2 PM or an indoor session.
>
> 5. **Smart AI Air Assistant:**  
>    Finally, you don't need to be an environmental scientist to understand the data. We have an **AI Air Copilot**. You can simply ask questions in plain English—like *'Can I go for a jog right now?'* or *'Is it safe for my football team to practice this evening?'*—and it answers instantly based on live sensor readings and your health profile."

---

### **[1:45 – 2:35] How AWS Powers AirTrace**

> "Now, to make all of this fast, reliable, and real-time, we built AirTrace on top of **Amazon Web Services (AWS)**:
>
> First, **AWS Amplify Hosting**.  
> Amplify hosts our entire Next.js frontend web app. The best part is its automated CI/CD pipeline—every time we push our code to GitHub, Amplify automatically builds and deploys it across global edge locations. It handles our environment variables securely, gives us built-in HTTPS, and ensures the website opens instantly on both mobile phones and laptops without any server headaches.
>
> Second, **Amazon Bedrock**.  
> Normal AI models can hallucinate and give dangerous health advice. To prevent this, our AI Copilot runs on foundation models through **Amazon Bedrock**. Because Bedrock connects directly to our backend, we feed it live CPCB station data and the user's actual health details as context.
>
> Bedrock turns raw numbers like 'PM2.5 is 220' into simple, practical advice: *'Shift your cricket practice to 3 PM, wear an N95 mask, and keep water handy.'* It is enterprise-secure, serverless, and responds within seconds."

---

### **[2:35 – 3:00] Conclusion & Impact**

> "At the end of the day, AirTrace takes open government pollution data and turns it into smart daily decisions for regular people. 
>
> By combining live CPCB sensors with the reliability of **AWS Amplify** and the intelligence of **Amazon Bedrock**, we are helping students, athletes, and daily commuters take control of the air they breathe.
>
> Stop guessing the air quality—navigate cleaner with AirTrace. Thank you!"

---

### **Quick Presentation Tips for Indian Hackathons / College Demos**

| Time Window | What to Show on Screen | Speaking Tone |
| :--- | :--- | :--- |
| **0:00 – 0:35** | Delhi smog picture / Problem statement | Serious, relatable, highlight winter smog reality |
| **0:35 – 1:10** | AirTrace Dashboard & Route Planner Map | Excited, show the green clean route comparison |
| **1:10 – 1:45** | Campus Decision tab & AI Assistant chatting | Practical, show how easily a student or school coach can use it |
| **1:45 – 2:35** | AWS Amplify live URL & Bedrock response | Confident tech explanation, show AWS reliability |
| **2:35 – 3:00** | Final AirTrace branding & live app link | Positive, impactful closing |
