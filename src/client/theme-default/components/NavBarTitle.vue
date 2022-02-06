<template>
  <a
    class="nav-bar-title"
    :href="$withBase($localePath)"
    :aria-label="`${$siteByRoute.title}, back to home`"
  >
    <img v-if="$themeConfig.logo" class="logo" :src="$withBase($themeConfig.logo)" alt="Logo" />
    {{ $site.title }}
  </a>
  <span v-if="$site.version" class="nav-bar-title-site-version">{{ $site.version }}</span>
</template>

<style scoped>
.nav-bar-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--c-text);
  display: flex;
  align-items: center;
}

.nav-bar-title:hover {
  text-decoration: none;
}

.logo {
  margin-right: 0.75rem;
  height: 1.3rem;
  vertical-align: bottom;
}

.nav-bar-title-site-version {
  margin-left: 10px;
  margin-top: 4px;
  color: #747474;
}
</style>
