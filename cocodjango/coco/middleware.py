import django_fast_ratelimit as ratelimit
from django.http import HttpResponseForbidden
import os
from dotenv import load_dotenv


load_dotenv()
rate_limit_value = int(os.getenv('DJANGO_GLOBAL_REQUEST_RATE_LIMIT', '10'))
rate_limit_time = os.getenv('DJANGO_GLOBAL_REQUEST_RATE_LIMIT_TIME', 'm')
rate_limit_block = os.getenv(
    'DJANGO_GLOBAL_REQUEST_RATE_LIMIT_BLOCK', 'True').lower() in ['true', '1', 'yes']

rate_limit_string = f"{rate_limit_value}/{rate_limit_time}"


class RateLimitMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Define a list of paths or view functions to exclude from rate limiting
        excluded_views = [
            'app_name.views.excluded_view'
        ]
        
        # Check if the request matches a view and get the view name
        if request.resolver_match is not None:
            current_view = request.resolver_match.view_name
        else:
            current_view = None

        # Check if the current view is excluded from rate limiting
        if current_view in excluded_views:
            return self.get_response(request)

        # Apply global rate limit for all other requests
        @ratelimit.decorate(key="ip", rate=rate_limit_string, block=rate_limit_block)
        def _inner_view(request):
            pass

        try:
            _inner_view(request)
        except ratelimit.RatelimitExceeded:
            return HttpResponseForbidden("Rate limit exceeded. Try again later.")

        return self.get_response(request)
