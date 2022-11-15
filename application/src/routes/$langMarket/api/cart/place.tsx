import { ActionFunction } from '@remix-run/node';
import { authenticate, isAuthenticated as isServerSideAuthenticated } from '~/core-server/authentication.server';
import { handleAndPlaceCart, hydrateCart } from '~/use-cases/checkout/cart';
import { getContext } from '~/use-cases/http/utils';
import { privateJson } from '~/bridge/privateJson.server';
import { getStoreFront } from '~/core-server/storefront.server';

export const action: ActionFunction = async ({ request }) => {
    const requestContext = getContext(request);
    const { secret: storefront } = await getStoreFront(requestContext.host);
    const isAuthenticated = await isServerSideAuthenticated(request);
    const authUser = isAuthenticated ? (await authenticate(request))?.user : null;
    const body = await request.json();

    const cart = await hydrateCart(storefront.apiClient, requestContext.language, body);
    const customerIdentifier = authUser?.aud || body.customer?.email || 'unknow@unknown.com';
    const customer = {
        ...body.customer,
        // we enforce those 3 values from the Authentication, it might not be overridden in the Form
        email: body.customer?.email || authUser?.aud || 'unknow@unknown.com',
        firstname: body.customer?.firstname || authUser.firstname,
        lastname: body.customer?.lastname || authUser.lastname,
        // then we decide of and customerIdentifier
        customerIdentifier,
        isGuest: !isAuthenticated,
    };
    return privateJson(await handleAndPlaceCart(cart, customer, body.cartId as string));
};
