import React, { useEffect, useRef } from 'react';
import { Tooltip } from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const CommonFunctions = () => {
  const menuRef = useRef(null);
  const menuTogglerRef = useRef([]);
  const menuInnerRef = useRef(null);
  const menuInnerShadowRef = useRef(null);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const layoutMenuEl = document.querySelectorAll('#layout-menu');

      layoutMenuEl.forEach((element) => {
        const newMenu = new Menu(element, {
          orientation: 'vertical',
          closeChildren: false,
        });
        window.Helpers.scrollToActive(false);
        window.Helpers.mainMenu = newMenu;
      });

      menuTogglerRef.current.forEach((item) => {
        item.addEventListener('click', (event) => {
          event.preventDefault();
          window.Helpers.toggleCollapsed();
        });
      });

      if (menuRef.current) {
        const delay = (elem, callback) => {
          let timeout = null;
          elem.onmouseenter = function () {
            if (!window.Helpers.isSmallScreen()) {
              timeout = setTimeout(callback, 300);
            } else {
              timeout = setTimeout(callback, 0);
            }
          };
          elem.onmouseleave = function () {
            document.querySelector('.layout-menu-toggle').classList.remove('d-block');
            clearTimeout(timeout);
          };
        };

        delay(menuRef.current, () => {
          if (!window.Helpers.isSmallScreen()) {
            document.querySelector('.layout-menu-toggle').classList.add('d-block');
          }
        });

        document.querySelector('.layout-menu-toggle').classList.add('d-block');
      }

      if (menuInnerRef.current && menuInnerShadowRef.current) {
        menuInnerRef.current.addEventListener('ps-scroll-y', function () {
          if (this.querySelector('.ps__thumb-y').offsetTop) {
            menuInnerShadowRef.current.style.display = 'block';
          } else {
            menuInnerShadowRef.current.style.display = 'none';
          }
        });
      }

      const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
      tooltipTriggerList.map((tooltipTriggerEl) => {
        return new Tooltip(tooltipTriggerEl);
      });

      const accordionTriggerList = [].slice.call(document.querySelectorAll('.accordion'));
      const accordionActiveFunction = (e) => {
        if (e.type === 'show.bs.collapse') {
          e.target.closest('.accordion-item').classList.add('active');
        } else {
          e.target.closest('.accordion-item').classList.remove('active');
        }
      };

      accordionTriggerList.forEach((accordionTriggerEl) => {
        accordionTriggerEl.addEventListener('show.bs.collapse', accordionActiveFunction);
        accordionTriggerEl.addEventListener('hide.bs.collapse', accordionActiveFunction);
      });

      window.Helpers.setAutoUpdate(true);
      window.Helpers.initPasswordToggle();
      window.Helpers.initSpeechToText();

      if (window.Helpers.isSmallScreen()) {
        return;
      }

      window.Helpers.setCollapsed(true, false);
    }

    return () => {
      menuTogglerRef.current.forEach((item) => {
        item.removeEventListener('click', window.Helpers.toggleCollapsed);
      });
      if (menuInnerRef.current) {
        menuInnerRef.current.removeEventListener('ps-scroll-y', window.Helpers.scrollToActive);
      }
      const accordionTriggerList = [].slice.call(document.querySelectorAll('.accordion'));
      accordionTriggerList.forEach((accordionTriggerEl) => {
        accordionTriggerEl.removeEventListener('show.bs.collapse', accordionActiveFunction);
        accordionTriggerEl.removeEventListener('hide.bs.collapse', accordionActiveFunction);
      });
    };
  }, []);

  return (
    <div>
      <div id="layout-menu" ref={menuRef} />
      <div className="layout-menu-toggle" ref={(el) => menuTogglerRef.current.push(el)} />
      <div className="menu-inner" ref={menuInnerRef}>
        <div className="menu-inner-shadow" ref={menuInnerShadowRef} />
      </div>
    </div>
  );
};

export default CommonFunctions;
