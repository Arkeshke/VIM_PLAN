(function () {
    'use strict';

    /* ---------- 1. Появление блоков при скролле ---------- */
    var revealTargets = document.querySelectorAll('.reveal, .grid-reveal');

    function revealAll() {
        Array.prototype.forEach.call(revealTargets, function (el) {
            el.classList.add('is-visible');
        });
    }

    if ('IntersectionObserver' in window && revealTargets.length) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

        Array.prototype.forEach.call(revealTargets, function (el) { io.observe(el); });

        /* Страховка: если IO по какой-то причине не сработал —
           показываем ТОЛЬКО те блоки, которые уже должны быть видны
           (находятся в зоне видимости или выше неё).
           Остальные оставляем анимироваться при скролле. */
        window.setTimeout(function () {
            var line = window.innerHeight * 0.92;
            Array.prototype.forEach.call(revealTargets, function (el) {
                if (el.classList.contains('is-visible')) { return; }
                if (el.getBoundingClientRect().top < line) {
                    el.classList.add('is-visible');
                }
            });
        }, 3000);
    } else {
        revealAll();
    }

    /* ---------- 2. Аналитика ---------- */
    function track(goal, params) {
        window.dataLayer = window.dataLayer || [];
        var payload = { event: 'goal', goal: goal };
        if (params) {
            for (var key in params) {
                if (Object.prototype.hasOwnProperty.call(params, key)) {
                    payload[key] = params[key];
                }
            }
        }
        window.dataLayer.push(payload);
        if (window.console && typeof window.console.info === 'function') {
            window.console.info('[analytics]', goal, params || '');
        }
    }

    document.addEventListener('click', function (event) {
        var target = event.target;
        if (!target || typeof target.closest !== 'function') { return; }
        var el = target.closest('[data-goal]');
        if (!el) { return; }
        track(el.getAttribute('data-goal'), { label: (el.textContent || '').trim() });
    });

    /* ---------- 3. Мобильное меню ---------- */
    var navToggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('primary-nav');

    function closeNav() {
        if (!nav || !navToggle) { return; }
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Открыть меню');
    }

    if (navToggle && nav) {
        navToggle.addEventListener('click', function () {
            var isOpen = nav.classList.toggle('is-open');
            navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            navToggle.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
        });

        nav.addEventListener('click', function (event) {
            var link = event.target;
            if (link && typeof link.closest === 'function' && link.closest('a')) {
                closeNav();
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') { closeNav(); }
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth > 960) { closeNav(); }
        });
    }

    /* ---------- 4. Тень у шапки при скролле ---------- */
    var header = document.querySelector('.site-header');
    if (header) {
        var onScroll = function () {
            header.classList.toggle('is-scrolled', window.pageYOffset > 8);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ---------- 5. Диалог демо ---------- */
    var dialog = document.getElementById('demo-dialog');
    var openBtn = document.querySelector('[data-open-demo]');

    if (dialog && openBtn) {
        openBtn.addEventListener('click', function () {
            if (typeof dialog.showModal === 'function') {
                dialog.showModal();
            } else {
                dialog.setAttribute('open', '');
            }
        });

        var closeBtn = dialog.querySelector('.dialog-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function () { dialog.close(); });
        }

        dialog.addEventListener('click', function (event) {
            if (event.target === dialog) { dialog.close(); }
        });
    }

    /* ---------- 6. Текущий год в футере ---------- */
    var yearEl = document.getElementById('year');
    if (yearEl) {
        yearEl.textContent = String(new Date().getFullYear());
    }

    /* ---------- 7. FAQ: плавное открытие/закрытие ---------- */
    var faqItems = document.querySelectorAll('.faq-item');

    if (faqItems.length) {
        /* Синхронизируем .is-open с атрибутом [open] — на случай,
           если <details> переключается нативно (JS-анимация отключена,
           prefers-reduced-motion и т.п.). */
        Array.prototype.forEach.call(faqItems, function (item) {
            item.classList.toggle('is-open', item.hasAttribute('open'));
            new MutationObserver(function () {
                item.classList.toggle('is-open', item.hasAttribute('open'));
            }).observe(item, { attributes: true, attributeFilter: ['open'] });
        });

        var reduceMotion = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!reduceMotion) {
            Array.prototype.forEach.call(faqItems, function (item) {
                var summary = item.querySelector('summary');
                var body = item.querySelector('.faq-body');
                if (!summary || !body) { return; }

                var DURATION = 350;
                var EASING = 'cubic-bezier(.4,0,.2,1)';
                var isOpen = item.hasAttribute('open');
                var timer = null;

                summary.addEventListener('click', function (event) {
                    event.preventDefault();

                    if (timer) {
                        window.clearTimeout(timer);
                        timer = null;
                    }

                    if (isOpen) {
                        /* ---------- ЗАКРЫТИЕ ---------- */
                        isOpen = false;
                        item.classList.remove('is-open');

                        /* Фиксируем текущую (видимую) высоту */
                        body.style.transition = 'none';
                        body.style.overflow = 'hidden';
                        body.style.height = body.getBoundingClientRect().height + 'px';
                        body.offsetHeight; /* принудительный reflow */

                        /* Анимируем в 0 */
                        body.style.transition = 'height ' + DURATION + 'ms ' + EASING;
                        body.style.height = '0px';

                        timer = window.setTimeout(function () {
                            item.removeAttribute('open');
                            body.style.transition = '';
                            body.style.overflow = '';
                            body.style.height = '';
                            timer = null;
                        }, DURATION);

                    } else {
                        /* ---------- ОТКРЫТИЕ ---------- */
                        isOpen = true;
                        item.classList.add('is-open');

                        /* 1) Открываем ДО измерения — контент становится видимым */
                        if (!item.hasAttribute('open')) {
                            item.setAttribute('open', '');
                        }

                        /* 2) Схлопываем в 0, чтобы до старта анимации не было
                              видимого контента (paint не случится — JS синхронный) */
                        body.style.transition = 'none';
                        body.style.overflow = 'hidden';
                        body.style.height = '0px';
                        body.offsetHeight; /* reflow: фиксируем 0 */

                        /* 3) Меряем натуральную высоту в следующем кадре.
                              requestAnimationFrame гарантирует, что браузер
                              уже пересчитал layout для открытого <details>
                              (в т.ч. с content-visibility: hidden в Chrome 130+). */
                        window.requestAnimationFrame(function () {
                            var targetHeight = body.scrollHeight;

                            /* Если вдруг получили 0 — не анимируем, просто показываем */
                            if (!targetHeight) {
                                body.style.transition = '';
                                body.style.overflow = '';
                                body.style.height = '';
                                return;
                            }

                            body.style.transition = 'height ' + DURATION + 'ms ' + EASING;
                            body.style.height = targetHeight + 'px';

                            timer = window.setTimeout(function () {
                                body.style.transition = '';
                                body.style.overflow = '';
                                body.style.height = '';
                                timer = null;
                            }, DURATION);
                        });
                    }
                });
            });
        }
    }

})();