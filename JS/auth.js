import {popShow} from "/JS/home.js"

import { AuthSetup } from "/JS/supabaseJS.js";

const Auth = new AuthSetup();

export function auth(element) {
    // Create modal HTML if it doesn't exist
    if (!document.querySelector(".modal-overlay")) {
        const modalHTML = `
            <div class="modal-overlay" style="display:none;">
                <div class="signup-container">
                    <div class="modal-header">
                        <h2 id="modalTitle">Sign Up</h2>
                        <button class="close-btn-signup">&times;</button>
                    </div>
                    <form id="authForm">
                   
                        <input type="email" id="email" placeholder="Email" required>
                        <input type="password" id="password" placeholder="Password" required>
                        <input type="password" id="repeatPassword" placeholder="Confirm Password" required>
                        <button type="submit" id="submitBtn" class="signup-btn">SIGN UP</button>
                    </form>
                    <div class="footer-text">
                        <span id="footerMsg">Already have an account?</span>
                        <span id="toggleAuth">Sign in</span>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Add styles
    let style = document.getElementById("auth-style");
    if (!style) {
        style = document.createElement('style');
        style.id = "auth-style";
        style.textContent = `
            .modal-overlay { z-index: 999; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.85); display: none; justify-content: center; align-items: center; }
            .signup-container { background-color: #0a0a0a; width: 100%; max-width: 400px; padding: 30px; border-radius: 8px; border: 1px solid #1a1a1a; }
            .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
            .modal-header h2 { color: white; font-size: 22px; margin: 0; }
            .close-btn-signup { background: none; border: none; color: #888; font-size: 28px; cursor: pointer; }
            .close-btn-signup:hover { color: white; }
            input { width: 100%; padding: 14px; margin-bottom: 15px; background-color: transparent; border: 1px solid #333; border-radius: 4px; color: white; font-size: 15px; box-sizing: border-box; }
            input:focus { outline: none; border-color: white; }
            .signup-btn { width: 100%; padding: 14px; background-color: white; color: black; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; margin-top: 10px; }
            .signup-btn:hover { background-color: #e0e0e0; }
            .footer-text { color: #777; text-align: center; margin-top: 20px; font-size: 14px; }
            #toggleAuth { color: white; cursor: pointer; font-weight: 500; margin-left: 5px; }
            #toggleAuth:hover { text-decoration: underline; }
        `;
        
    }

    // Open modal on click
    element.onclick = () => {
        document.querySelector(".modal-overlay").style.display = "flex";
        document.head.appendChild(style);
    };

    // Close modal
    const closeBtn = document.querySelector(".close-btn-signup");
    if (closeBtn) {
        closeBtn.onclick = () => {
            document.querySelector(".modal-overlay").style.display = "none"; // FIXED: was style = "none"
            document.head.removeChild(style);
        };
    }

    // Get DOM elements
    const authForm = document.getElementById('authForm');
    const modalTitle = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('submitBtn');
    const toggleBtn = document.getElementById('toggleAuth');
    const footerMsg = document.getElementById('footerMsg');
        const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const repeatPasswordInput = document.getElementById('repeatPassword');

    let isLoginMode = false;

    // Toggle Logic
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            isLoginMode = !isLoginMode;
            if (isLoginMode) {
                modalTitle.innerText = "Sign In";
                submitBtn.innerText = "SIGN IN";
                footerMsg.innerText = "Don't have an account?";
                toggleBtn.innerText = "Sign up";
                           repeatPasswordInput.style.display = "none";
                     repeatPasswordInput.required = false;
            } else {
                modalTitle.innerText = "Sign Up";
                submitBtn.innerText = "SIGN UP";
                footerMsg.innerText = "Already have an account?";
                toggleBtn.innerText = "Sign in";
                
                repeatPasswordInput.style.display = "block";
                     repeatPasswordInput.required = true;
            }
        });
    }

    // Form Submit Logic
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (isLoginMode) {
                const res = await Auth.signIn(email, password);
                if (res.success) {
                    popShow(`Login successful!`,"1ABC9C","fff","showSuc",3000)
                    
                    document.querySelector('.modal-overlay').style.display = 'none';
                } else {
                    popShow(`${res.error}`,"EF4444","FEF2F2","errors",3000)
                    
                }
            } else {
                if (password !== repeatPasswordInput.value.trim()) {
                    popShow("Passwords do not match!","EF4444","FEF2F2","errors",3000)
                    
                }

                const res = await Auth.createUser(email, password);
                if (res.success) {
                    popShow(`<i class="fa-solid fa-circle-check" style="margin-right:5px;"></i> your account has been created!`,"1ABC9C","fff","showSuc",3000)
                    document.querySelector('.modal-overlay').style.display = 'none';
                } else {
                    popShow(res.error,"EF4444","FEF2F2","errors",3000)
                    
                }
            }
        });
    }
}