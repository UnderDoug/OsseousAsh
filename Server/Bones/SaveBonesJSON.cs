using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Newtonsoft.Json;

namespace OsseousAsh.Server.Bones
{
    [JsonObject(MemberSerialization.OptOut)]
    [Serializable]
    public class SaveBonesJSON
    {
        #region SaveGameJSON

        public int InfoVersion = 1;
        public int SaveVersion;
        public string GameVersion;

        public string ID;

        public string Name;
        public int Level;

        public string GenoSubType;

        public string GameMode;

        public string CharIcon;
        public char FColor;
        public char DColor;

        public string Location;
        public string InGameTime;
        public long Turn;
        public string SaveTime;

        public List<string> ModsEnabled;

        #endregion

        public Guid OsseousAshID;
        public string OsseousAshHandle;

        public string ModVersion;
        public long SaveTimeValue;

        public string ZoneID;
        public string DeathReason;

        public string GenotypeName;
        public string SubtypeName;
        public string Blueprint;
    }
}
