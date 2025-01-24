<script>
  export let provider;
</script>

<div class="card">
  <div class="flex items-center mb-4">
    <img
      src={provider.profilePictureURL || '/src/images/avatar.jpg'}
      alt="{provider.name}"
      class="w-16 h-16 rounded-full object-cover mr-4"
    />
    <div>
      <h2 class="title text-white">{provider.name}</h2>
      <div class="flex items-center">
        <span class="text-yellow-400">★</span>
        <span class="ml-1">{provider.rating.toFixed(1)}</span>
      </div>
    </div>
  </div>

  <p class="text-white mb-4 line-clamp-3">{provider.bio}</p>
  
  <div class="flex justify-between items-center mb-4">
    <span class="font-semibold text-white">${provider.hourlyRate}/hour</span>
    <span class="text-white">{provider.experienceYears} years exp.</span>
  </div>

  <a
    href="/providers/{provider.user_id}"
    class="btn"
  >
    View Profile
  </a>
</div>
