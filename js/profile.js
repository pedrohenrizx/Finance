// js/profile.js

document.addEventListener('DOMContentLoaded', () => {
    // Theme setup
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }

    // Mobile menu toggle (Melhoria 12)
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebarNav = document.getElementById('sidebarNav');
    if (mobileMenuBtn && sidebarNav) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebarNav.classList.toggle('hidden');
        });
        // Fechar ao clicar fora ou num link (Melhoria 12)
        sidebarNav.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && window.innerWidth < 768) {
                sidebarNav.classList.add('hidden');
            }
        });
    }

    const currentUser = Parse.User.current();
    if (!currentUser) return;

    // Load User Data
    const loadUserData = () => {
        const username = currentUser.get('username') || '';
        const email = currentUser.get('email') || '';
        const fullName = currentUser.get('name') || '';
        const avatar = currentUser.get('avatar'); // Parse.File

        document.getElementById('editUsername').value = username;
        document.getElementById('editEmail').value = email;
        document.getElementById('editName').value = fullName;

        document.getElementById('profileId').textContent = currentUser.id;
        if (currentUser.createdAt) {
            document.getElementById('profileCreatedAt').textContent = new Date(currentUser.createdAt).toLocaleDateString('pt-BR');
        }

        const initials = (fullName ? fullName.charAt(0) : username.charAt(0)).toUpperCase();
        document.getElementById('profileInitials').textContent = initials;

        if (avatar) {
            const preview = document.getElementById('profileImagePreview');
            preview.src = avatar.url();
            preview.classList.remove('hidden');
            document.getElementById('profileInitials').classList.add('hidden');
        }
    };

    loadUserData();

    // Handle Profile Edit (Melhoria 14 & 25)
    const profileForm = document.getElementById('profileForm');
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        Utils.setButtonLoading('saveProfileBtn', true);

        const newEmail = document.getElementById('editEmail').value;
        const newName = document.getElementById('editName').value;

        currentUser.set('email', newEmail);
        currentUser.set('name', newName);

        try {
            await currentUser.save();
            Toast.show('Perfil atualizado com sucesso!', 'success');
            loadUserData(); // refresh initials if name changed
        } catch (error) {
            Toast.show('Erro ao atualizar: ' + error.message, 'error');
        } finally {
            Utils.setButtonLoading('saveProfileBtn', false);
        }
    });

    // Handle Avatar Upload (Melhoria 13)
    const avatarInput = document.getElementById('avatarUpload');
    const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
    let selectedFile = null;

    avatarInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            selectedFile = e.target.files[0];
            const reader = new FileReader();
            reader.onload = function(event) {
                const preview = document.getElementById('profileImagePreview');
                preview.src = event.target.result;
                preview.classList.remove('hidden');
                document.getElementById('profileInitials').classList.add('hidden');
            };
            reader.readAsDataURL(selectedFile);
            uploadAvatarBtn.classList.remove('hidden');
        }
    });

    uploadAvatarBtn.addEventListener('click', async () => {
        if (!selectedFile) return;
        Utils.setButtonLoading('uploadAvatarBtn', true);

        try {
            const name = "avatar.jpg";
            const parseFile = new Parse.File(name, selectedFile);
            await parseFile.save();

            currentUser.set('avatar', parseFile);
            await currentUser.save();

            Toast.show('Foto de perfil atualizada!', 'success');
            uploadAvatarBtn.classList.add('hidden');
        } catch (error) {
            Toast.show('Erro no upload: ' + error.message, 'error');
        } finally {
            Utils.setButtonLoading('uploadAvatarBtn', false);
        }
    });
});
