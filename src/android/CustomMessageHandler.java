package cordova.plugin.followanalytics;

import android.util.Log;
import org.json.JSONObject;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import com.followapps.android.FollowApps;
import com.followapps.android.internal.push.DefaultMessageHandler;
import android.content.ContentValues;
import android.content.Context;
import java.util.ArrayList;
import java.util.List;
import java.lang.Exception;
import  java.util.Map;
import org.json.JSONException;

public class CustomMessageHandler extends DefaultMessageHandler {

    public static final String KEY_DEEP_LINKING = "com.followapps.android.cordova.onPushMessageClicked";
    public static final String KEY_EVENT = "event";
    public static final String KEY_BUTTON = "button";
    public static final String KEY_URL = "url";
    public static final String EVENT_PUSH_CLICKED = "onPushMessageClicked";
    public static final String EVENT_PUSH_URL_CLICKED = "onPushDeeplinkingClicked";
    public static final String EVENT_IN_APP_CLICKED = "onInAppMessageClicked";


    @Override
    public void onPushMessageClicked(Context context, String url, Map<String, String> data) {
        super.onPushMessageClicked(context, url, data);
    }

    @Override
    public void onPushMessageClicked(Context context, Map<String, String> data) {
        JSONObject object  = convertMapToJson(data);
        try {
            object.put(KEY_EVENT,EVENT_PUSH_CLICKED);
        }catch (Exception e){

        }

        FollowAnalyticsCordovaPlugin.sendExtras(object.toString());

        super.onPushMessageClicked(context,data);
    }

    private static JSONObject convertMapToJson(Map<String,String> map) {
        JSONObject obj = new JSONObject();
        try {
            for (Map.Entry<String, String> entry : map.entrySet()) {
                obj.put(entry.getKey(),entry.getValue());
            }
        }catch (Exception e){

        }
        return obj;
    }
}


